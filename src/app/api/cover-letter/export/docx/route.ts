import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/schema';
import { CoverLetterData } from '@/lib/cover-letter/schema';
import { renderCoverLetterDocx } from '@/lib/docx/cover-letter-renderer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coverLetter: CoverLetterData = body.coverLetter;
    const resumeData: ResumeData = body.resumeData;
    const templateSettings = body.templateSettings;

    if (!coverLetter || !resumeData) {
      return NextResponse.json({ error: 'Missing coverLetter or resumeData' }, { status: 400 });
    }

    const docxBuffer = await renderCoverLetterDocx(coverLetter, resumeData, templateSettings);

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="cover-letter.docx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating Cover Letter DOCX:', error);
    return NextResponse.json({ error: error.message || 'Failed to export Cover Letter DOCX' }, { status: 500 });
  }
}
