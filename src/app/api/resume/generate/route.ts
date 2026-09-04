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
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not set. Please create a .env.local file in the project root containing: GEMINI_API_KEY=your_key_here' 
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const jsonSchema = getResumeJsonSchema();
    const prompt = `${RESUME_GENERATION_SYSTEM_PROMPT}\n\nResume Text:\n${resumeText}\n\nJob Description:\n${jobDescription}`;

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.5-flash','gemini-3.5-flash-lite'];
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
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }
      if (result?.text) break;
    }

    if (!result?.text) {
      throw lastError || new Error('No text generated from Gemini API');
    }

    const responseText = result.text;

    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(cleanedText);
    const validatedData = ResumeDataSchema.parse(parsedData);

    return NextResponse.json({ resume: validatedData });
  } catch (error: any) {
    console.error('Error generating resume:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate resume'
    }, { status: 500 });
  }
}
