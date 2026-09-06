import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/lib/schema';
import { generateResumePdfBuffer } from '@/lib/pdf/server-pdf-generator';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeData: ResumeData = body.resumeData || body.resume;
    const templateSettings = body.templateSettings;

    if (!resumeData) {
      return NextResponse.json({ error: 'Missing resume data' }, { status: 400 });
    }

    const candidateName = (resumeData.personal_info?.full_name || 'Candidate')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const roleTitle = (resumeData.work_experience?.[0]?.roles?.[0]?.title || 'Software_Engineer')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${candidateName}_resume_${roleTitle}.pdf`;

    const pdfBuffer = await generateResumePdfBuffer(resumeData, { templateSettings });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
