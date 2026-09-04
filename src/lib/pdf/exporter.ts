'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportResumeToPdf(filename: string = 'resume.pdf'): Promise<void> {
  const element = document.getElementById('resume-paper-element') || document.querySelector('.resume-paper');
  if (!element) {
    throw new Error('Resume preview element not found. Please ensure your resume is visible.');
  }

  // Find all no-print elements and temporarily hide them
  const noPrintElements = element.querySelectorAll('.no-print');
  const originalDisplayStates: string[] = [];
  noPrintElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    originalDisplayStates[index] = htmlEl.style.display;
    htmlEl.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2, // 2x resolution for razor-sharp typography
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Letter format dimensions in points (72 points/inch: 8.5in = 612pt, 11in = 792pt)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Scale canvas to fit page width
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Subsequent pages if resume content exceeds 1 page
    while (heightLeft > 15) { // Small threshold to avoid accidental trailing blank page
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } finally {
    // Restore no-print elements visibility
    noPrintElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplayStates[index] || '';
    });
  }
}
