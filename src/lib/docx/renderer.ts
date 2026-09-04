import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { ResumeData } from '../schema';
import { parseFormattedRuns } from '../format-text';
import type { TemplateSettings } from '../../store/resume-store';

function xmlEscape(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts formatted markdown/HTML text (**bold**, *italic*, <u>underline</u>, [label](url))
 * into native WordprocessingML <w:r> run elements.
 */
function formatRunsToXml(
  text: string,
  options: { bold?: boolean; italic?: boolean; size?: number; font?: string } = {}
): string {
  const runs = parseFormattedRuns(text);
  if (runs.length === 0) return '';

  const defBold = !!options.bold;
  const defItalic = !!options.italic;
  const size = options.size || 20;
  const font = options.font || 'Garamond';

  return runs.map(r => {
    const isB = r.bold !== undefined ? r.bold : defBold;
    const isI = r.italic !== undefined ? r.italic : defItalic;
    const isU = !!r.underline;
    const isLink = !!r.linkUrl;

    return `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:cs="${font}" w:eastAsia="${font}" w:hAnsi="${font}"/>${isB ? '<w:b w:val="1"/><w:bCs w:val="1"/>' : ''}${isI ? '<w:i w:val="1"/><w:iCs w:val="1"/>' : ''}${isU || isLink ? '<w:u w:val="single"/>' : ''}${isLink ? '<w:color w:val="0563C1"/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(r.text)}</w:t></w:r>`;
  }).join('');
}

export async function renderResumeDocx(
  data: ResumeData,
  templateSettings?: Partial<TemplateSettings>
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), 'Template', 'Devang Srivastava - Resume.docx');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template DOCX file not found at: ' + templatePath);
  }

  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);
  const originalXml = zip.file('word/document.xml')?.asText();

  if (!originalXml) {
    throw new Error('Could not extract word/document.xml from template');
  }

  // Template settings resolution
  const fontFamily = templateSettings?.fontFamily || 'Garamond';
  const rawColor = (templateSettings?.accentColor || '000000').replace('#', '').trim();
  const accentColor = /^[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor.toUpperCase() : '000000';

  const marginKey = templateSettings?.marginSize ?? 'normal';
  const marginConfig = marginKey === 'compact'
    ? { top: 180, bottom: 250, left: 504, right: 504 }
    : marginKey === 'spacious'
    ? { top: 360, bottom: 500, left: 1080, right: 1080 }
    : { top: 180, bottom: 414, left: 720, right: 720 };

  const rightTabPos = 12240 - (marginConfig.left + marginConfig.right);

  const spacingKey = templateSettings?.lineSpacing ?? 'normal';
  const lineSpacingVal = spacingKey === 'tight' ? 220 : spacingKey === 'relaxed' ? 280 : 252;

  const sizeKey = templateSettings?.fontSize ?? 'standard';
  const fontSizeDelta = sizeKey === 'compact' ? -1 : sizeKey === 'spacious' ? 1 : 0;

  // Extract <w:sectPr> from the original document and apply dynamic margins
  const sectPrMatch = originalXml.match(/<w:sectPr\b[^>]*>[\s\S]*?<\/w:sectPr>/);
  const rawSectPr = sectPrMatch 
    ? sectPrMatch[0] 
    : '<w:sectPr><w:headerReference r:id="rId7" w:type="default"/><w:headerReference r:id="rId8" w:type="first"/><w:footerReference r:id="rId9" w:type="first"/><w:pgSz w:h="15840" w:w="12240" w:orient="portrait"/><w:pgMar w:bottom="414" w:top="180" w:left="720" w:right="720" w:header="144" w:footer="288"/><w:pgNumType w:start="1"/><w:titlePg w:val="1"/></w:sectPr>';
  
  const newPgMar = `<w:pgMar w:bottom="${marginConfig.bottom}" w:top="${marginConfig.top}" w:left="${marginConfig.left}" w:right="${marginConfig.right}" w:header="144" w:footer="288"/>`;
  const sectPrXml = rawSectPr.replace(/<w:pgMar\b[^>]*\/>/, newPgMar);

  const paragraphs: string[] = [];

  // Helper: Section header paragraph with bottom border
  const makeSectionHeader = (title: string) => {
    return `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="1" w:sz="6" w:val="single"/></w:pBdr><w:spacing w:before="120" w:line="${lineSpacingVal}" w:lineRule="auto"/><w:rPr/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${24 + fontSizeDelta}"/><w:szCs w:val="${24 + fontSizeDelta}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(title)}</w:t></w:r></w:p>`;
  };

  // Helper: Two-column line with right-aligned tab stop
  const makeTwoColumnLine = (
    leftText: string, 
    rightText: string, 
    options: { leftBold?: boolean; leftItalic?: boolean; rightItalic?: boolean; leftSize?: number; rightSize?: number; spacingBefore?: number } = {}
  ) => {
    const leftSize = (options.leftSize || 20) + fontSizeDelta;
    const rightSize = (options.rightSize || 20) + fontSizeDelta;
    const spacingBeforeAttr = options.spacingBefore ? ` w:before="${options.spacingBefore}"` : '';

    return `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs><w:spacing${spacingBeforeAttr} w:line="${lineSpacingVal}" w:lineRule="auto"/><w:rPr/></w:pPr>${formatRunsToXml(leftText, { bold: options.leftBold, italic: options.leftItalic, size: leftSize, font: fontFamily })}<w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/></w:rPr><w:tab/></w:r>${formatRunsToXml(rightText, { italic: options.rightItalic, size: rightSize, font: fontFamily })}</w:p>`;
  };

  // Helper: Bullet point (ilvl 0 = level 1 bullet, ilvl 1 = sub-bullet)
  const makeBulletItem = (text: string, ilvl: number = 0, numId: number = 3) => {
    const indAttr = ilvl === 0 ? '<w:ind w:left="360"/>' : '<w:ind w:left="720"/>';
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:line="${lineSpacingVal}" w:lineRule="auto"/>${indAttr}</w:pPr>${formatRunsToXml(text, { size: 20 + fontSizeDelta, font: fontFamily })}</w:p>`;
  };

  // Helper: Sub-bullet with bold label
  const makeLabeledSubBullet = (label: string, text: string, ilvl: number = 1, numId: number = 3) => {
    const indAttr = ilvl === 0 ? '<w:ind w:left="360"/>' : '<w:ind w:left="1080" w:hanging="360"/><w:jc w:val="both"/>';
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:line="${lineSpacingVal}" w:lineRule="auto"/>${indAttr}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${20 + fontSizeDelta}"/><w:szCs w:val="${20 + fontSizeDelta}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(label)}: </w:t></w:r>${formatRunsToXml(text, { size: 20 + fontSizeDelta, font: fontFamily })}</w:p>`;
  };

  // 1. Personal Info
  if (data.personal_info?.full_name) {
    paragraphs.push(
      `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="1" w:sz="6" w:val="single"/></w:pBdr><w:spacing w:line="${lineSpacingVal + 24}" w:lineRule="auto"/><w:rPr/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${48 + fontSizeDelta * 2}"/><w:szCs w:val="${48 + fontSizeDelta * 2}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(data.personal_info.full_name)}</w:t></w:r></w:p>`
    );
  }

  const contact = data.personal_info?.contact;
  const contactLine = [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.links,
  ].filter(Boolean).map(s => String(s).trim()).join(' | ');

  if (contactLine) {
    paragraphs.push(
      `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="1" w:sz="6" w:val="single"/></w:pBdr><w:spacing w:line="${lineSpacingVal + 24}" w:lineRule="auto"/><w:rPr/></w:pPr>${formatRunsToXml(contactLine, { size: 22 + fontSizeDelta, font: fontFamily })}</w:p>`
    );
  }

  // 2. Work Experience
  const workExps = data.work_experience || [];
  if (workExps.length > 0) {
    paragraphs.push(makeSectionHeader('WORK EXPERIENCE'));

    for (let cIndex = 0; cIndex < workExps.length; cIndex++) {
      const exp = workExps[cIndex];
      // Company name + dates
      paragraphs.push(
        makeTwoColumnLine(exp.company || '', exp.dates || '', {
          leftBold: true,
          leftSize: 21,
          rightSize: 20,
          spacingBefore: cIndex > 0 ? 80 : 40,
        })
      );

      const roles = exp.roles || [];
      for (const role of roles) {
        // Role title + location/dates
        const rightParts: string[] = [];
        if (role.dates && roles.length > 1) rightParts.push(role.dates);
        if (role.location) rightParts.push(role.location);
        const roleRightText = rightParts.join(' | ');

        paragraphs.push(
          makeTwoColumnLine(role.title || '', roleRightText, {
            leftItalic: true,
            rightItalic: true,
            leftSize: 20,
            rightSize: 20,
          })
        );

        // Descriptions
        if (Array.isArray(role.description)) {
          for (const desc of role.description) {
            if (desc && desc.trim()) {
              paragraphs.push(makeBulletItem(desc.trim(), 0, 3));
            }
          }
        }

        // Key Results
        if (role.key_results && role.key_results.length > 0) {
          const keyResultsText = role.key_results.filter(Boolean).join('; ');
          if (keyResultsText.trim()) {
            paragraphs.push(makeLabeledSubBullet('Key Results', keyResultsText.trim(), 1, 3));
          }
        }

        // Technologies/Skills Used
        if (role.technologies_used && role.technologies_used.length > 0) {
          const techText = role.technologies_used.filter(Boolean).join(', ');
          if (techText.trim()) {
            paragraphs.push(makeLabeledSubBullet('Technologies/Skills Used', techText.trim(), 1, 3));
          }
        }
      }
    }
  }

  // 3. Education
  const edus = data.education || [];
  if (edus.length > 0) {
    paragraphs.push(makeSectionHeader('EDUCATION'));

    for (let eIndex = 0; eIndex < edus.length; eIndex++) {
      const edu = edus[eIndex];
      // University + Graduation Date
      paragraphs.push(
        makeTwoColumnLine(edu.university || '', edu.graduation_date || '', {
          leftBold: true,
          leftSize: 24,
          rightSize: 24,
          spacingBefore: eIndex > 0 ? 80 : 40,
        })
      );

      // Degree, Major + Location
      const degreeMajor = [edu.degree, edu.major].filter(Boolean).join(', ');
      paragraphs.push(
        makeTwoColumnLine(degreeMajor, edu.location || '', {
          leftItalic: true,
          rightItalic: true,
          leftSize: 20,
          rightSize: 20,
        })
      );

      // Honors & Awards
      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        const honorsText = edu.honors_and_awards.filter(Boolean).join(', ');
        if (honorsText.trim()) {
          paragraphs.push(makeLabeledSubBullet('Honors & Awards', honorsText.trim(), 0, 1));
        }
      }

      // Activities
      if (edu.activities && edu.activities.length > 0) {
        const actText = edu.activities.filter(Boolean).join(', ');
        if (actText.trim()) {
          paragraphs.push(makeLabeledSubBullet('Activities', actText.trim(), 0, 1));
        }
      }
    }
  }

  // 4. Skills & Interests
  const skills = data.skills_and_interests;
  const hasSkills = skills && (
    (skills.certifications && skills.certifications.length > 0) ||
    (skills.technologies && skills.technologies.length > 0) ||
    (skills.skills && skills.skills.length > 0) ||
    (skills.interests && skills.interests.length > 0)
  );

  if (hasSkills) {
    paragraphs.push(makeSectionHeader('CERTIFICATIONS, SKILLS & INTERESTS'));

    if (skills.certifications && skills.certifications.length > 0) {
      paragraphs.push(makeLabeledSubBullet('Certifications', skills.certifications.filter(Boolean).join(', '), 0, 1));
    }
    if (skills.technologies && skills.technologies.length > 0) {
      paragraphs.push(makeLabeledSubBullet('Technologies', skills.technologies.filter(Boolean).join(', '), 0, 1));
    }
    if (skills.skills && skills.skills.length > 0) {
      paragraphs.push(makeLabeledSubBullet('Skills', skills.skills.filter(Boolean).join(', '), 0, 1));
    }
    if (skills.interests && skills.interests.length > 0) {
      paragraphs.push(makeLabeledSubBullet('Interests', skills.interests.filter(Boolean).join(', '), 0, 1));
    }
  }

  // 5. Custom Sections (e.g. Projects, Publications, Leadership, Awards)
  const customSections = data.custom_sections || [];
  for (const sec of customSections) {
    if (!sec.section_title) continue;
    paragraphs.push(makeSectionHeader(sec.section_title));

    for (let i = 0; i < sec.items.length; i++) {
      const item = sec.items[i];
      // Title + dates
      paragraphs.push(
        makeTwoColumnLine(item.title || '', item.dates || '', {
          leftBold: true,
          leftSize: 21,
          rightSize: 20,
          spacingBefore: i > 0 ? 80 : 40,
        })
      );

      // Subtitle + location
      if (item.subtitle || item.location) {
        paragraphs.push(
          makeTwoColumnLine(item.subtitle || '', item.location || '', {
            leftItalic: true,
            rightItalic: true,
            leftSize: 20,
            rightSize: 20,
          })
        );
      }

      // Description bullets
      if (Array.isArray(item.description)) {
        for (const bullet of item.description) {
          if (bullet && bullet.trim()) {
            paragraphs.push(makeBulletItem(bullet.trim(), 0, 3));
          }
        }
      }
    }
  }

  // Reconstruct the full word/document.xml with root tags and sectPr preserved
  const docStartMatch = originalXml.match(/^([\s\S]*?<w:body>)/);
  const docStart = docStartMatch ? docStartMatch[1] : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>';
  const docEnd = '</w:body></w:document>';

  const newXml = `${docStart}${paragraphs.join('')}${sectPrXml}${docEnd}`;

  zip.file('word/document.xml', newXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
