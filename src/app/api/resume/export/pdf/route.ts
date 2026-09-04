import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'PDF export requires LibreOffice to be installed. Please export as DOCX instead.' 
  }, { status: 501 });
}
