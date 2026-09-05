import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ResumeDataSchema, getResumeJsonSchema } from '@/lib/schema';
import { RESUME_GENERATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeText = body.resumeText || body.originalResumeText;
    const { jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    
    // If API key is not configured on Vercel, fallback to built-in keyword alignment engine
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables. Tailoring resume using built-in keyword alignment engine.');
      const { sampleResumeData } = await import('@/lib/sample-data');
      const { parseResumeTextToData, synthesizeTailoredResumeOffline } = await import('@/lib/format-resume');
      const base = parseResumeTextToData(resumeText, sampleResumeData);
      const tailored = synthesizeTailoredResumeOffline(base, jobDescription);
      return NextResponse.json({ 
        resume: tailored,
        notice: 'Tailored using built-in keyword alignment. To use Gemini AI, add GEMINI_API_KEY to your Vercel Project Settings -> Environment Variables.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const jsonSchema = getResumeJsonSchema();
    const prompt = `${RESUME_GENERATION_SYSTEM_PROMPT}\n\nResume Text:\n${resumeText}\n\nJob Description:\n${jobDescription}`;

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
      console.warn('All Gemini API models failed or unreachable, tailoring resume offline:', lastError?.message);
      const { sampleResumeData } = await import('@/lib/sample-data');
      const { parseResumeTextToData, synthesizeTailoredResumeOffline } = await import('@/lib/format-resume');
      const base = parseResumeTextToData(resumeText, sampleResumeData);
      validatedData = synthesizeTailoredResumeOffline(base, jobDescription);
    } else {
      const responseText = result.text;

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedData = JSON.parse(cleanedText);
      validatedData = ResumeDataSchema.parse(parsedData);
    }

    return NextResponse.json({ resume: validatedData });
  } catch (error: any) {
    console.error('Error generating resume:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate resume'
    }, { status: 500 });
  }
}
