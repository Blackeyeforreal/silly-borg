import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { ResumeDataSchema, getResumeJsonSchema, ResumeData } from '@/lib/schema';
import { RESUME_GENERATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { renderResumeDocx } from '@/lib/docx/renderer';
import { sampleResumeData } from '@/lib/sample-data';
import { DEFAULT_TEMPLATE_SETTINGS, TemplateSettings } from '@/store/resume-store';
import { formatResumeDataToText, synthesizeTailoredResumeOffline } from '@/lib/format-resume';
import { normalizeResumeData, extractTargetRole } from '@/lib/normalization/resume-normalizer';
import { getUserProfileByEmail } from '@/lib/db';
import { synthesizeCoverLetterOffline } from '@/lib/cover-letter/synthesizer';
import { renderCoverLetterDocx } from '@/lib/docx/cover-letter-renderer';
import { getCoverLetterJsonSchema, CoverLetterDataSchema } from '@/lib/cover-letter/schema';
import { generateResumePdfBuffer } from '@/lib/pdf/server-pdf-generator';

export const runtime = 'nodejs';
export const maxDuration = 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email',
};

const DATA_DIR = path.join(process.cwd(), '.data');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

function getUserSavedProfile(email: string): { resumeData: ResumeData; templateSettings: TemplateSettings } | null {
  // 1. Try SQLite Database first
  try {
    const dbProfile = getUserProfileByEmail(email);
    if (dbProfile?.savedProfile?.resumeData) {
      return dbProfile.savedProfile;
    }
  } catch (dbErr) {
    console.warn('Error reading from SQLite db in extension route:', dbErr);
  }

  // 2. Try legacy JSON profiles file
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const content = fs.readFileSync(PROFILES_FILE, 'utf-8');
      const store = JSON.parse(content);
      if (store[email]?.savedProfile) {
        return store[email].savedProfile;
      }
    }
  } catch (err) {
    console.warn('Error reading profiles file:', err);
  }

  // 3. Pre-seed demo fallback
  if (email.includes('alex.chen') || email.includes('demo')) {
    return {
      resumeData: {
        ...sampleResumeData,
        personal_info: {
          full_name: 'Alex Chen',
          contact: {
            email,
            phone: '+1 (555) 019-2834',
            location: 'San Francisco, CA',
            links: 'https://linkedin.com/in/alexchen | https://github.com/alexchen'
          }
        }
      },
      templateSettings: DEFAULT_TEMPLATE_SETTINGS
    };
  }

  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    const headerEmail = req.headers.get('x-user-email');
    let email = headerEmail;

    if (!email && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        email = authHeader.substring(7).trim();
      } else {
        email = authHeader.trim();
      }
    }

    const body = await req.json().catch(() => ({}));
    if (!email && body.email) {
      email = body.email;
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in with your email or connect the extension.' },
        { status: 401, headers: corsHeaders }
      );
    }

    email = email.toLowerCase().trim();

    // 2. Validate job description
    const jobDescription = body.jobDescription || body.selectedText || '';
    if (!jobDescription || jobDescription.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please select or provide a valid job description (at least 10 characters).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Resolve Master Profile
    let userProfile = body.savedProfile || getUserSavedProfile(email);
    if (!userProfile?.resumeData) {
      return NextResponse.json(
        { 
          error: `No saved master profile found for ${email}. Please log into the web app at http://localhost:3000 to save your work history and template preferences first.` 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const effectiveResumeText = formatResumeDataToText(userProfile.resumeData);
    const templateSettings = userProfile.templateSettings || DEFAULT_TEMPLATE_SETTINGS;

    // 4. API Key Check & Resilience
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    let validatedResume: ResumeData;

    const isCoverLetter = body.type === 'cover-letter' || body.target === 'cover-letter';

    if (isCoverLetter) {
      let coverLetterData;
      if (!apiKey) {
        coverLetterData = synthesizeCoverLetterOffline(userProfile.resumeData, jobDescription, 'professional');
      } else {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const jsonSchema = getCoverLetterJsonSchema();
          const resumeText = formatResumeDataToText(userProfile.resumeData);
          const prompt = `You are an elite executive career coach. Write a compelling tailored cover letter for this candidate based on their resume and job description.\n\nResume Details:\n${resumeText}\n\nJob Description:\n${jobDescription}`;
          const clRes = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: jsonSchema,
            }
          });
          const parsed = JSON.parse(clRes.text || '{}');
          coverLetterData = CoverLetterDataSchema.parse(parsed);
        } catch (clErr) {
          console.warn('Cover letter AI synthesis fallback to offline:', clErr);
          coverLetterData = synthesizeCoverLetterOffline(userProfile.resumeData, jobDescription, 'professional');
        }
      }

      const docxBuffer = await renderCoverLetterDocx(coverLetterData, userProfile.resumeData, templateSettings);
      const safeName = (userProfile.resumeData.personal_info?.full_name || 'Tailored').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Cover_Letter_${safeName}.docx`;

      return NextResponse.json(
        {
          success: true,
          type: 'cover-letter',
          coverLetter: coverLetterData,
          docxBase64: docxBuffer.toString('base64'),
          filename,
          user: { email, name: userProfile.resumeData.personal_info?.full_name || email }
        },
        { headers: corsHeaders }
      );
    }

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured in environment. Tailoring resume using built-in keyword alignment engine.');
      validatedResume = synthesizeTailoredResumeOffline(userProfile.resumeData, jobDescription);
    } else {
      // 5. Generate tailored resume via Gemini
      const ai = new GoogleGenAI({ apiKey });
      const jsonSchema = getResumeJsonSchema();
      const prompt = `${RESUME_GENERATION_SYSTEM_PROMPT}\n\nResume Text:\n${effectiveResumeText}\n\nJob Description:\n${jobDescription}`;

      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro'
      ];
      let result: any = null;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            result = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                responseSchema: jsonSchema,
              }
            });
            if (result?.text) break;
          } catch (err: any) {
            lastError = err;
            console.warn(`Extension API: Attempt ${attempt} for model ${modelName} failed:`, err.message || err);
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
        if (result?.text) break;
      }

      if (!result?.text) {
        console.warn('Gemini models unreachable, tailoring resume offline:', lastError?.message);
        validatedResume = synthesizeTailoredResumeOffline(userProfile.resumeData, jobDescription);
      } else {
        let cleanedText = result.text.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsedData = JSON.parse(cleanedText);
        validatedResume = ResumeDataSchema.parse(parsedData);
      }
    }

    // 6. Normalize resume data before rendering (clean prefixes, remove duplicates, extract semantic links)
    const normalizedResume = normalizeResumeData(validatedResume);

    // Format target role and candidate name for standard filename: {Name}_resume_{role}
    const candidateName = (normalizedResume.personal_info?.full_name || userProfile.resumeData.personal_info?.full_name || 'Candidate')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Determine primary/target role from job description or latest experience
    const defaultRole = normalizedResume.work_experience?.[0]?.roles?.[0]?.title || 'Software_Engineer';
    const targetRole = extractTargetRole(jobDescription, defaultRole);

    const wantsPdf = body.format === 'pdf' || body.type === 'pdf';

    if (wantsPdf) {
      const pdfBuffer = await generateResumePdfBuffer(normalizedResume, { templateSettings });
      const filename = `${candidateName}_resume_${targetRole}.pdf`;

      const acceptHeader = req.headers.get('accept') || '';
      if (acceptHeader.includes('application/pdf')) {
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
          }
        });
      }

      return NextResponse.json(
        {
          success: true,
          type: 'resume-pdf',
          resume: normalizedResume,
          pdfBase64: pdfBuffer.toString('base64'),
          filename,
          user: { email, name: normalizedResume.personal_info?.full_name || email }
        },
        { headers: corsHeaders }
      );
    }

    // 7. Render to DOCX buffer
    const docxBuffer = await renderResumeDocx(normalizedResume, templateSettings);
    const filename = `${candidateName}_resume_${targetRole}.docx`;

    // 8. Check if client wants binary stream or base64 JSON
    const acceptHeader = req.headers.get('accept') || '';
    const wantsBinary = body.format === 'docx' || acceptHeader.includes('application/vnd.openxmlformats-officedocument');

    if (wantsBinary) {
      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}"`,
        }
      });
    }

    // Default: JSON response with base64 encoded document for single-trip extension download
    return NextResponse.json(
      {
        success: true,
        type: 'resume',
        resume: normalizedResume,
        docxBase64: docxBuffer.toString('base64'),
        filename,
        user: { email, name: normalizedResume.personal_info?.full_name || email }
      },
      { headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Extension generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate tailored resume' },
      { status: 500, headers: corsHeaders }
    );
  }
}
