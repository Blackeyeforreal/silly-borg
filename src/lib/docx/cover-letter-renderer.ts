import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { ResumeData } from '../schema';
import { CoverLetterData } from '../cover-letter/schema';
import { TemplateSettings } from '../../store/resume-store';
import { parseFormattedRuns } from '../format-text';
import { DocxLinkRegistry } from './renderer';

function xmlEscape(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function renderCoverLetterDocx(
  letter: CoverLetterData,
  resume: ResumeData,
  templateSettings?: Partial<TemplateSettings>
): Promise<Buffer> {
  const candidatePaths = [
    path.join(process.cwd(), 'Template', 'Devang Srivastava - Resume.docx'),
    path.join(process.cwd(), '..', 'Template', 'Devang Srivastava - Resume.docx'),
    path.join(__dirname, '..', '..', '..', 'Template', 'Devang Srivastava - Resume.docx'),
    path.join(__dirname, '..', '..', 'Template', 'Devang Srivastava - Resume.docx'),
  ];
  const templatePath = candidatePaths.find((p) => fs.existsSync(p));

  if (!templatePath) {
    throw new Error('Template DOCX file not found in paths: ' + candidatePaths.join(', '));
  }

  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);
  const originalXml = zip.file('word/document.xml')?.asText();

  if (!originalXml) {
    throw new Error('Could not extract word/document.xml from template');
  }

  const linkRegistry = new DocxLinkRegistry();

  // Typography & Layout settings
  const fontFamily = templateSettings?.fontFamily || 'Garamond';
  const rawColor = (templateSettings?.accentColor || '000000').replace('#', '').trim();
  const accentColor = /^[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor.toUpperCase() : '000000';

  // 0.75in margins standard for cover letters (1080 twips)
  const marginConfig = { top: 720, bottom: 720, left: 1080, right: 1080 };
  const sectPrXml = `<w:sectPr><w:pgSz w:h="15840" w:w="12240" w:orient="portrait"/><w:pgMar w:bottom="${marginConfig.bottom}" w:top="${marginConfig.top}" w:left="${marginConfig.left}" w:right="${marginConfig.right}" w:header="144" w:footer="288"/><w:pgNumType w:start="1"/></w:sectPr>`;

  const paragraphs: string[] = [];

  const formatTextRunsXml = (
    text: string,
    opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}
  ) => {
    const runs = parseFormattedRuns(text);
    if (runs.length === 0) return '';

    const defBold = !!opts.bold;
    const defItalic = !!opts.italic;
    const sz = opts.size || 22; // 11pt default

    return runs
      .map((r) => {
        const isB = r.bold !== undefined ? r.bold : defBold;
        const isI = r.italic !== undefined ? r.italic : defItalic;
        const isU = !!r.underline;
        const isLink = !!r.linkUrl;
        const colVal = isLink ? '0563C1' : opts.color;
        const col = colVal ? `<w:color w:val="${colVal}"/>` : '';

        const rPr = `<w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/>${
          isB ? '<w:b w:val="1"/><w:bCs w:val="1"/>' : ''
        }${isI ? '<w:i w:val="1"/><w:iCs w:val="1"/>' : ''}${isU || isLink ? '<w:u w:val="single"/>' : ''}${col}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>`;
        const runXml = `<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(r.text)}</w:t></w:r>`;

        if (isLink && r.linkUrl) {
          const relId = linkRegistry.register(r.linkUrl);
          return `<w:hyperlink r:id="${relId}" w:history="1">${runXml}</w:hyperlink>`;
        }

        return runXml;
      })
      .join('');
  };

  const makePara = (
    runsXml: string,
    opts: {
      align?: string;
      spaceBefore?: number;
      spaceAfter?: number;
      borderBottom?: boolean;
      lineSpacing?: number;
    } = {}
  ) => {
    const jc = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
    const before = opts.spaceBefore !== undefined ? opts.spaceBefore : 0;
    const after = opts.spaceAfter !== undefined ? opts.spaceAfter : 160; // 8pt after
    const line = opts.lineSpacing ? opts.lineSpacing : 276; // 1.15 line spacing
    const pBdr = opts.borderBottom
      ? `<w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="${accentColor}"/></w:pBdr>`
      : '';
    return `<w:p><w:pPr>${jc}<w:spacing w:before="${before}" w:after="${after}" w:line="${line}" w:lineRule="auto"/>${pBdr}</w:pPr>${runsXml}</w:p>`;
  };

  // 1. Candidate Name (Header)
  const candidateName = resume.personal_info?.full_name || 'Candidate Name';
  paragraphs.push(
    makePara(formatTextRunsXml(candidateName, { bold: true, size: 36 }), {
      align: 'center',
      spaceBefore: 0,
      spaceAfter: 40,
    })
  );

  // 2. Candidate Contact Line
  const contact = resume.personal_info?.contact;
  const contactParts: string[] = [];
  if (contact?.email) {
    contactParts.push(contact.email.includes('[') ? contact.email : `[${contact.email}](mailto:${contact.email})`);
  }
  if (contact?.phone) contactParts.push(contact.phone);
  if (contact?.location) contactParts.push(contact.location);
  if (contact?.portfolio) {
    const pUrl = contact.portfolio.startsWith('http') ? contact.portfolio : `https://${contact.portfolio}`;
    contactParts.push(contact.portfolio.includes('[') ? contact.portfolio : `[Portfolio](${pUrl})`);
  }
  if (contact?.linkedin) {
    const lUrl = contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`;
    contactParts.push(contact.linkedin.includes('[') ? contact.linkedin : `[LinkedIn](${lUrl})`);
  }
  if (contact?.github) {
    const gUrl = contact.github.startsWith('http') ? contact.github : `https://${contact.github}`;
    contactParts.push(contact.github.includes('[') ? contact.github : `[GitHub](${gUrl})`);
  }
  if (contact?.links) contactParts.push(contact.links);

  if (contactParts.length > 0) {
    paragraphs.push(
      makePara(formatTextRunsXml(contactParts.join('  |  '), { size: 19, color: '555555' }), {
        align: 'center',
        spaceBefore: 0,
        spaceAfter: 280,
        borderBottom: true,
      })
    );
  }

  // 3. Date
  const dateStr =
    letter.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  paragraphs.push(makePara(formatTextRunsXml(dateStr, { size: 21 }), { spaceBefore: 120, spaceAfter: 200 }));

  // 4. Recipient Block
  const recipientRuns = [
    letter.recipient_name || 'Hiring Team',
    letter.recipient_title || 'Hiring Manager',
    letter.company_name || 'Company',
  ].filter(Boolean);

  recipientRuns.forEach((line, idx) => {
    paragraphs.push(
      makePara(formatTextRunsXml(line, { bold: idx === 0, size: 21 }), {
        spaceBefore: 0,
        spaceAfter: idx === recipientRuns.length - 1 ? 240 : 40,
      })
    );
  });

  // 5. Salutation
  const salutation = `Dear ${letter.recipient_name || 'Hiring Manager'},`;
  paragraphs.push(makePara(formatTextRunsXml(salutation, { bold: true, size: 21 }), { spaceBefore: 0, spaceAfter: 180 }));

  // 6. Opening Paragraph
  if (letter.opening_paragraph) {
    paragraphs.push(
      makePara(formatTextRunsXml(letter.opening_paragraph, { size: 21 }), {
        spaceBefore: 0,
        spaceAfter: 180,
        lineSpacing: 280,
      })
    );
  }

  // 7. Body Paragraphs
  for (const bodyPara of letter.body_paragraphs || []) {
    if (bodyPara) {
      paragraphs.push(
        makePara(formatTextRunsXml(bodyPara, { size: 21 }), {
          spaceBefore: 0,
          spaceAfter: 180,
          lineSpacing: 280,
        })
      );
    }
  }

  // 8. Closing Paragraph
  if (letter.closing_paragraph) {
    paragraphs.push(
      makePara(formatTextRunsXml(letter.closing_paragraph, { size: 21 }), {
        spaceBefore: 0,
        spaceAfter: 260,
        lineSpacing: 280,
      })
    );
  }

  // 9. Sign-off
  paragraphs.push(makePara(formatTextRunsXml(letter.sign_off || 'Sincerely,', { size: 21 }), { spaceBefore: 0, spaceAfter: 400 }));

  // 10. Candidate Signature Name
  paragraphs.push(makePara(formatTextRunsXml(candidateName, { bold: true, size: 21 }), { spaceBefore: 0, spaceAfter: 0 }));

  // Assemble full WordprocessingML
  const bodyXml = `<w:body>${paragraphs.join('')}${sectPrXml}</w:body>`;
  const newDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" mc:Ignorable="w14">${bodyXml}</w:document>`;

  zip.file('word/document.xml', newDocumentXml);

  // Inject hyperlinks into word/_rels/document.xml.rels
  if (linkRegistry.hasLinks()) {
    const relsPath = 'word/_rels/document.xml.rels';
    const originalRels = zip.file(relsPath)?.asText();
    if (originalRels) {
      const extraRelsXml = linkRegistry.getRelationshipsXml();
      const updatedRels = originalRels.replace('</Relationships>', `${extraRelsXml}</Relationships>`);
      zip.file(relsPath, updatedRels);
    }
  }

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
