import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfModule = require('pdf-parse');
        if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
          const result = await parser.getText();
          text = result.text || '';
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          }
        } else if (typeof pdfModule === 'function') {
          const data = await pdfModule(buffer);
          text = data.text || '';
        } else if (typeof pdfModule.default === 'function') {
          const data = await pdfModule.default(buffer);
          text = data.text || '';
        } else {
          throw new Error('Unsupported pdf-parse module format');
        }
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        throw new Error('Failed to parse PDF: ' + (err.message || String(err)));
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
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error extracting text:', error);
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 });
  }
}
