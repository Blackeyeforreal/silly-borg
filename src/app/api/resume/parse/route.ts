import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ResumeDataSchema, getResumeJsonSchema } from '@/lib/schema';
import { parseResumeWithNLP } from '@/lib/nlp/resume-nlp';
import { parseResumeTextToData } from '@/lib/format-resume';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RESUME_PARSER_SYSTEM_PROMPT = `You are an elite, industry-leading ATS and HR resume extraction engine.
Your task is to analyze the provided raw resume text (which may be extracted from PDF, DOCX, or text) and extract EVERY piece of candidate information into the provided JSON schema.

CRITICAL EXTRACTION RULES:
1. COMPLETENESS (100% RECALL):
   - Extract ALL work experience companies, roles, dates, locations, and ALL bullet points. Do NOT summarize or omit any achievement bullet. Copy the details verbatim.
   - Extract ALL educational degrees, majors, universities, graduation dates, honors, and activities.
   - Extract ALL projects (place them into custom_sections with id 'custom_section_projects' and section_title 'PROJECTS'). Look specifically for project titles, live demo URLs, GitHub repository URLs, technologies used, and bullet points.
   - Extract ALL skills, technologies, certifications, and interests into skills_and_interests.
2. ACCURACY & FIDELITY:
   - Preserve exact metrics, numbers, percentages, and technical stacks.
   - Clean up fragmented lines caused by PDF extraction (stitch lines that belong to the same sentence).
3. CONTACT DETAILS:
   - Extract full name, email, phone number, location.
   - Extract portfolio URL, LinkedIn URL, GitHub URL into their respective contact fields.
`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const text = body.text || body.resumeText;
    const preferAi = body.preferAi === true || body.useAi === true;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Missing resume text to parse' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    // Fast, local NLP parser (0ms latency, zero API keys, Vercel Free Tier compatible)
    if (!preferAi || !apiKey) {
      const parsed = parseResumeWithNLP(text);
      const elapsed = Date.now() - startTime;
      return NextResponse.json({ 
        resume: parsed, 
        method: 'nlp',
        latencyMs: elapsed,
        notice: 'Parsed in real-time with local Compromise NLP engine.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const jsonSchema = getResumeJsonSchema();
    const prompt = `${RESUME_PARSER_SYSTEM_PROMPT}\n\nResume Document Content:\n${text}`;

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest'
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
          console.warn(`[Parser] Attempt ${attempt} for model ${modelName} failed:`, err.message || err);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }
      if (result?.text) break;
    }

    let validatedData: any;

    if (!result?.text) {
      console.warn('[Parser] All Gemini API models failed, falling back to local NLP parser:', lastError?.message);
      validatedData = parseResumeWithNLP(text);
      return NextResponse.json({ 
        resume: validatedData, 
        method: 'nlp',
        fallbackReason: lastError?.message || 'Gemini API unavailable'
      });
    }

    const responseText = result.text;
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(cleanedText);
    validatedData = ResumeDataSchema.parse(parsedData);

    return NextResponse.json({ 
      resume: validatedData, 
      method: 'ai' 
    });
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    // Even on uncaught error, fallback to offline parser to guarantee zero failure
    try {
      const body = await req.clone().json().catch(() => ({}));
      const text = body.text || body.resumeText;
      if (text) {
        const fallback = parseResumeWithNLP(text);
        return NextResponse.json({ resume: fallback, method: 'nlp' });
      }
    } catch {}

    return NextResponse.json({ 
      error: error.message || 'Failed to parse resume' 
    }, { status: 500 });
  }
}
