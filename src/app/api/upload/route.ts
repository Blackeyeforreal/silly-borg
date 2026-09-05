import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { extractTextFromPdfBuffer } from '@/lib/pdf-text-extractor';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = '';

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        text = await extractTextFromPdfBuffer(buffer);
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        return NextResponse.json({ error: err.message || 'Failed to extract text from PDF.' }, { status: 400 });
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      file.name.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a .pdf, .docx, or .txt file.' }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Could not find any readable text in this file.' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract text from file' }, { status: 500 });
  }
}
