import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { FIELD_REWRITE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fieldPath, currentValue, instruction, jobDescription } = body;
    const resumeContext = body.resumeContext || body.originalResumeText;

    if (!fieldPath || currentValue === undefined || !instruction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not set. Please create a .env.local file in the project root containing: GEMINI_API_KEY=your_key_here' 
      }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = `${FIELD_REWRITE_SYSTEM_PROMPT}\n\nField Path: ${fieldPath}\nCurrent Value: ${currentValue}\nInstruction: ${instruction}`;
    
    if (jobDescription) {
      prompt += `\nTarget Job Description: ${jobDescription}`;
    }
    
    if (resumeContext) {
      prompt += `\nFull Resume Context (JSON): ${JSON.stringify(resumeContext)}`;
    }

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest'];
    let result: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          result = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
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

    const text = result.text;

    let cleaned = text.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    return NextResponse.json({ rewrittenValue: cleaned });
  } catch (error: any) {
    console.error('Error rewriting field:', error);
    return NextResponse.json({ error: error.message || 'Failed to rewrite field' }, { status: 500 });
  }
}
