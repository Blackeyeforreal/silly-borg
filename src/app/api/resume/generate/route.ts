import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ResumeDataSchema, getResumeJsonSchema } from '@/lib/schema';
import { RESUME_GENERATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeText = body.resumeText || body.originalResumeText;
    const { jobDescription } = body;

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const jsonSchema = getResumeJsonSchema();
    const prompt = `${RESUME_GENERATION_SYSTEM_PROMPT}\n\nResume Text:\n${resumeText}\n\nJob Description:\n${jobDescription}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: jsonSchema,
      }
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error('No text generated from Gemini API');
    }

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
