'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface LinkAnnotationData {
  href: string;
  relX: number;
  relY: number;
  relW: number;
  relH: number;
}

function sanitizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  if (trimmed.includes('@')) {
    return `mailto:${trimmed}`;
  }
  return `https://${trimmed}`;
}

async function exportSheetsToPdf(sheetElements: HTMLElement[], filename: string): Promise<void> {
  // Find all no-print elements and temporarily hide them
  const noPrintElements = Array.from(document.querySelectorAll('.no-print')) as HTMLElement[];
  const originalDisplayStates: string[] = noPrintElements.map(el => el.style.display);
  noPrintElements.forEach(el => { el.style.display = 'none'; });

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    for (let i = 0; i < sheetElements.length; i++) {
      const sheetEl = sheetElements[i];

      // Collect link coordinates relative to this physical sheet
      const linkElements = Array.from(sheetEl.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const sheetRect = sheetEl.getBoundingClientRect();
      const pageLinks: LinkAnnotationData[] = [];

      for (const a of linkElements) {
        if (a.closest('.no-print')) continue;
        const href = sanitizeHref(a.getAttribute('href') || '');
        if (!href) continue;

        const rectList = a.getClientRects().length > 0 ? Array.from(a.getClientRects()) : [a.getBoundingClientRect()];
        for (const r of rectList) {
          if (r.width > 0 && r.height > 0 && sheetRect.width > 0 && sheetRect.height > 0) {
            pageLinks.push({
              href,
              relX: ((r.left - sheetRect.left) / sheetRect.width) * 612,
              relY: ((r.top - sheetRect.top) / sheetRect.height) * 792,
              relW: (r.width / sheetRect.width) * 612,
              relH: (r.height / sheetRect.height) * 792,
            });
          }
        }
      }

      const canvas = await html2canvas(sheetEl, {
        scale: 2, // 2x resolution for crisp editorial typography
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, clonedEl) => {
          const sheet = clonedEl as HTMLElement;
          if (sheet) {
            sheet.style.width = '816px';
            sheet.style.minWidth = '816px';
            sheet.style.maxWidth = '816px';
            sheet.style.height = '1056px';
            sheet.style.minHeight = '1056px';
            sheet.style.maxHeight = '1056px';
            sheet.style.boxSizing = 'border-box';
            sheet.style.margin = '0 auto';
            sheet.style.transform = 'none';
            sheet.style.overflow = 'hidden';
          }
          let parent = sheet?.parentElement;
          while (parent) {
            parent.style.transform = 'none';
            parent = parent.parentElement;
          }
          clonedDoc.querySelectorAll('aside').forEach((aside) => aside.remove());
          clonedDoc.querySelectorAll('.no-print').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.setPage(i + 1);
      pdf.addImage(imgData, 'JPEG', 0, 0, 612, 792, undefined, 'FAST');

      for (const link of pageLinks) {
        pdf.link(link.relX, link.relY, link.relW, link.relH, { url: link.href });
      }
    }

    pdf.save(filename);
  } finally {
    noPrintElements.forEach((el, index) => {
      el.style.display = originalDisplayStates[index] || '';
    });
  }
}

async function exportSingleElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const linkElements = Array.from(element.querySelectorAll('a[href]')) as HTMLAnchorElement[];
  const resumeRect = element.getBoundingClientRect();
  const linkBoxes: LinkAnnotationData[] = [];

  for (const a of linkElements) {
    if (a.closest('.no-print')) continue;
    const href = sanitizeHref(a.getAttribute('href') || '');
    if (!href) continue;

    const rectList = a.getClientRects().length > 0 ? Array.from(a.getClientRects()) : [a.getBoundingClientRect()];
    for (const r of rectList) {
      if (r.width > 0 && r.height > 0 && resumeRect.width > 0) {
        linkBoxes.push({
          href,
          relX: ((r.left - resumeRect.left) / resumeRect.width) * 612,
          relY: ((r.top - resumeRect.top) / resumeRect.width) * 612,
          relW: (r.width / resumeRect.width) * 612,
          relH: (r.height / resumeRect.width) * 612,
        });
      }
    }
  }

  const noPrintElements = element.querySelectorAll('.no-print');
  const originalDisplayStates: string[] = [];
  noPrintElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    originalDisplayStates[index] = htmlEl.style.display;
    htmlEl.style.display = 'none';
  });

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc, clonedEl) => {
        const resumeEl = (clonedEl || clonedDoc.getElementById('resume-paper-element')) as HTMLElement;
        if (resumeEl) {
          resumeEl.style.width = '816px';
          resumeEl.style.minWidth = '816px';
          resumeEl.style.maxWidth = '816px';
          resumeEl.style.boxSizing = 'border-box';
          resumeEl.style.margin = '0 auto';
          resumeEl.style.transform = 'none';
        }
        clonedDoc.querySelectorAll('aside').forEach((aside) => aside.remove());
        clonedDoc.querySelectorAll('.no-print').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 15) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const totalPages = pdf.getNumberOfPages();
    for (const box of linkBoxes) {
      const pageIndex = Math.floor(box.relY / pageHeight);
      const yOnPage = box.relY - pageIndex * pageHeight;
      if (pageIndex >= 0 && pageIndex < totalPages) {
        pdf.setPage(pageIndex + 1);
        pdf.link(box.relX, yOnPage, box.relW, box.relH, { url: box.href });
      }
    }

    pdf.save(filename);
  } finally {
    noPrintElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplayStates[index] || '';
    });
  }
}

export async function exportResumeToPdf(
  filename: string = 'resume.pdf',
  targetElement?: HTMLElement | null
): Promise<void> {
  // Check for discrete physical page sheets in DOM or within targetElement
  let sheetElements: HTMLElement[] = [];
  if (targetElement) {
    const internalSheets = Array.from(targetElement.querySelectorAll('.resume-page-sheet')) as HTMLElement[];
    if (internalSheets.length > 0) {
      sheetElements = internalSheets;
    } else if (targetElement.classList.contains('resume-page-sheet')) {
      sheetElements = [targetElement];
    }
  }

  if (sheetElements.length === 0 && typeof document !== 'undefined') {
    const docSheets = Array.from(document.querySelectorAll('.resume-page-sheet')) as HTMLElement[];
    if (docSheets.length > 0) {
      sheetElements = docSheets;
    }
  }

  if (sheetElements.length > 0) {
    await exportSheetsToPdf(sheetElements, filename);
    return;
  }

  const fallbackElement =
    targetElement ||
    (typeof document !== 'undefined'
      ? document.getElementById('resume-paper-element') ||
        (document.querySelector('.resume-paper') as HTMLElement)
      : null);

  if (!fallbackElement) {
    throw new Error('Resume preview element not found. Please ensure your resume is visible.');
  }

  await exportSingleElementToPdf(fallbackElement, filename);
}

