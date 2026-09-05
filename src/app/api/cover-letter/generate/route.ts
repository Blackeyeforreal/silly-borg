import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CoverLetterDataSchema, getCoverLetterJsonSchema } from '@/lib/cover-letter/schema';
import { synthesizeCoverLetterOffline, type CoverLetterTone } from '@/lib/cover-letter/synthesizer';
import { formatResumeDataToText } from '@/lib/format-resume';

export const runtime = 'nodejs';
export const maxDuration = 60;

const COVER_LETTER_SYSTEM_PROMPT = `You are an elite executive career coach and cover letter specialist.
Your goal is to write a compelling, tailored, and impact-oriented 3-4 paragraph cover letter for a candidate based on their resume and target job description.

RULES:
1. NO FABRICATION: Only reference roles, accomplishments, skills, and metrics actually present in the resume.
2. TAILORED VALUE: Directly align the candidate's achievements with the specific responsibilities and requirements of the job description.
3. CONCISE & PROFESSIONAL: Keep the letter to 1 page (roughly 250-350 words). Avoid generic fluff.
4. STRUCTURE:
   - Opening paragraph: State the target role, why the company/mission resonates, and a high-level value thesis.
   - 2 body paragraphs: Feature quantifiable achievements, relevant technologies, and problem-solving methodologies that solve the employer's needs.
   - Closing paragraph: Courteous call-to-action expressing excitement to discuss further.
5. Return the output STRICTLY adhering to the requested JSON schema.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeData, jobDescription, tone = 'professional' } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeData or jobDescription' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

    // Zero-fail offline fallback if API key is not configured
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Generating cover letter using built-in synthesizer.');
      const synthesized = synthesizeCoverLetterOffline(resumeData, jobDescription, tone as CoverLetterTone);
      return NextResponse.json({
        coverLetter: synthesized,
        notice: 'Generated using built-in offline engine. To use Gemini AI, add GEMINI_API_KEY to your environment.'
      });
    }

    const resumeText = formatResumeDataToText(resumeData);
    const ai = new GoogleGenAI({ apiKey });
    const jsonSchema = getCoverLetterJsonSchema();
    const prompt = `${COVER_LETTER_SYSTEM_PROMPT}

Requested Tone: ${tone.toUpperCase()}

Resume Details:
${resumeText}

Job Description:
${jobDescription}`;

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
          console.warn(`Attempt ${attempt} for model ${modelName} failed:`, err.message || err);
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
      if (result?.text) break;
    }

    let validatedData: any;

    if (!result?.text) {
      console.warn('All Gemini API models failed or unreachable, generating cover letter offline:', lastError?.message);
      validatedData = synthesizeCoverLetterOffline(resumeData, jobDescription, tone as CoverLetterTone);
    } else {
      let cleanedText = result.text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedText);
      validatedData = CoverLetterDataSchema.parse(parsed);
    }

    return NextResponse.json({ coverLetter: validatedData });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json({
      error: error.message || 'Failed to generate cover letter'
    }, { status: 500 });
  }
}
