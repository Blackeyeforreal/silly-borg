import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { ResumeData } from '../schema';
import { parseFormattedRuns } from '../format-text';
import { type TemplateSettings, getEffectiveSectionOrder } from '../../store/resume-store';
import { normalizeResumeData, getSemanticLinkLabel } from '../normalization/resume-normalizer';

function xmlEscape(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export class DocxLinkRegistry {
  private links: { id: string; url: string }[] = [];
  private nextId = 1;

  register(url: string): string {
    let cleanUrl = url.trim();
    if (cleanUrl.includes('@') && !cleanUrl.startsWith('mailto:')) {
      cleanUrl = 'mailto:' + cleanUrl;
    } else if (cleanUrl.startsWith('www.')) {
      cleanUrl = 'https://' + cleanUrl;
    } else if (
      !cleanUrl.startsWith('http://') &&
      !cleanUrl.startsWith('https://') &&
      !cleanUrl.startsWith('mailto:') &&
      !cleanUrl.startsWith('tel:')
    ) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const existing = this.links.find((l) => l.url === cleanUrl);
    if (existing) return existing.id;

    const id = `rIdLink_${this.nextId++}`;
    this.links.push({ id, url: cleanUrl });
    return id;
  }

  getRelationshipsXml(): string {
    return this.links
      .map((l) => {
        return `<Relationship Id="${l.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEscape(l.url)}" TargetMode="External"/>`;
      })
      .join('');
  }

  hasLinks(): boolean {
    return this.links.length > 0;
  }
}

/**
 * Converts formatted markdown/HTML text (**bold**, *italic*, <u>underline</u>, [label](url), raw URLs)
 * into native WordprocessingML <w:r> and <w:hyperlink> elements.
 */
function formatRunsToXml(
  text: string,
  options: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    font?: string;
    linkRegistry?: DocxLinkRegistry;
  } = {}
): string {
  const runs = parseFormattedRuns(text);
  if (runs.length === 0) return '';

  const defBold = !!options.bold;
  const defItalic = !!options.italic;
  const size = options.size || 20;
  const font = options.font || 'Garamond';
  const registry = options.linkRegistry;

  return runs
    .map((r) => {
      const isB = r.bold !== undefined ? r.bold : defBold;
      const isI = r.italic !== undefined ? r.italic : defItalic;
      const isU = !!r.underline;
      const isLink = !!r.linkUrl;

      const rPr = `<w:rPr><w:rFonts w:ascii="${font}" w:cs="${font}" w:eastAsia="${font}" w:hAnsi="${font}"/>${isB ? '<w:b w:val="1"/><w:bCs w:val="1"/>' : ''}${isI ? '<w:i w:val="1"/><w:iCs w:val="1"/>' : ''}${isU || isLink ? '<w:u w:val="single"/>' : ''}${isLink ? '<w:color w:val="0563C1"/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/><w:rtl w:val="0"/></w:rPr>`;
      const runXml = `<w:r>${rPr}<w:t xml:space="preserve">${xmlEscape(r.text)}</w:t></w:r>`;

      if (isLink && registry && r.linkUrl) {
        const relId = registry.register(r.linkUrl);
        return `<w:hyperlink r:id="${relId}" w:history="1">${runXml}</w:hyperlink>`;
      }

      return runXml;
    })
    .join('');
}

export async function renderResumeDocx(
  rawResumeData: ResumeData,
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

  // Pre-process and normalize data
  const data = normalizeResumeData(rawResumeData);

  const templateContent = fs.readFileSync(templatePath);
  const zip = new PizZip(templateContent);
  const originalXml = zip.file('word/document.xml')?.asText();

  if (!originalXml) {
    throw new Error('Could not extract word/document.xml from template');
  }

  const linkRegistry = new DocxLinkRegistry();

  // Template settings resolution
  const fontFamily = templateSettings?.fontFamily || 'Garamond';
  const rawColor = (templateSettings?.accentColor || '000000').replace('#', '').trim();
  const accentColor = /^[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor.toUpperCase() : '000000';

  const marginKey = templateSettings?.marginSize ?? 'normal';
  const marginConfig =
    marginKey === 'compact'
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
    return `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="1" w:sz="6" w:val="single"/></w:pBdr><w:spacing w:before="120" w:line="${lineSpacingVal}" w:lineRule="auto"/><w:rPr/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${
      22 + fontSizeDelta
    }"/><w:szCs w:val="${22 + fontSizeDelta}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(title)}</w:t></w:r></w:p>`;
  };

  // Helper: Two-column line with right-aligned tab stop
  const makeTwoColumnLine = (
    leftText: string,
    rightText: string,
    options: {
      leftBold?: boolean;
      leftItalic?: boolean;
      rightItalic?: boolean;
      leftSize?: number;
      rightSize?: number;
      spacingBefore?: number;
    } = {}
  ) => {
    const leftSize = (options.leftSize || 20) + fontSizeDelta;
    const rightSize = (options.rightSize || 19) + fontSizeDelta;
    const spacingBeforeAttr = options.spacingBefore ? ` w:before="${options.spacingBefore}"` : '';

    return `<w:p><w:pPr><w:tabs><w:tab w:val="right" w:pos="${rightTabPos}"/></w:tabs><w:spacing${spacingBeforeAttr} w:line="${lineSpacingVal}" w:lineRule="auto"/><w:rPr/></w:pPr>${formatRunsToXml(
      leftText,
      { bold: options.leftBold, italic: options.leftItalic, size: leftSize, font: fontFamily, linkRegistry }
    )}<w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/></w:rPr><w:tab/></w:r>${formatRunsToXml(
      rightText,
      { italic: options.rightItalic, size: rightSize, font: fontFamily, linkRegistry }
    )}</w:p>`;
  };

  // Helper: Bullet point (ilvl 0 = level 1 bullet, ilvl 1 = sub-bullet)
  const makeBulletItem = (text: string, ilvl: number = 0, numId: number = 3) => {
    const indAttr = ilvl === 0 ? '<w:ind w:left="360"/>' : '<w:ind w:left="720"/>';
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:line="${lineSpacingVal}" w:lineRule="auto"/>${indAttr}</w:pPr>${formatRunsToXml(
      text,
      { size: 19 + fontSizeDelta, font: fontFamily, linkRegistry }
    )}</w:p>`;
  };

  // Helper: Sub-bullet with bold label
  const makeLabeledSubBullet = (label: string, text: string, ilvl: number = 1, numId: number = 3) => {
    const indAttr = ilvl === 0 ? '<w:ind w:left="360"/>' : '<w:ind w:left="1080" w:hanging="360"/><w:jc w:val="both"/>';
    return `<w:p><w:pPr><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:line="${lineSpacingVal}" w:lineRule="auto"/>${indAttr}</w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${
      19 + fontSizeDelta
    }"/><w:szCs w:val="${19 + fontSizeDelta}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(
      label
    )}: </w:t></w:r>${formatRunsToXml(text, { size: 19 + fontSizeDelta, font: fontFamily, linkRegistry })}</w:p>`;
  };

  // 1. Personal Info
  if (data.personal_info?.full_name) {
    paragraphs.push(
      `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="2" w:sz="12" w:val="single"/></w:pBdr><w:spacing w:line="${
        lineSpacingVal + 24
      }" w:lineRule="auto"/><w:rPr/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="${fontFamily}" w:cs="${fontFamily}" w:eastAsia="${fontFamily}" w:hAnsi="${fontFamily}"/><w:b w:val="1"/><w:bCs w:val="1"/><w:sz w:val="${
        46 + fontSizeDelta * 2
      }"/><w:szCs w:val="${46 + fontSizeDelta * 2}"/><w:rtl w:val="0"/></w:rPr><w:t xml:space="preserve">${xmlEscape(
        data.personal_info.full_name
      )}</w:t></w:r></w:p>`
    );
  }

  const contact = data.personal_info?.contact;
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
  const contactLine = contactParts
    .filter(Boolean)
    .map((s) => String(s).trim())
    .join(' | ');

  if (contactLine) {
    paragraphs.push(
      `<w:p><w:pPr><w:pBdr><w:bottom w:color="${accentColor}" w:space="1" w:sz="6" w:val="single"/></w:pBdr><w:spacing w:line="${
        lineSpacingVal + 24
      }" w:lineRule="auto"/><w:rPr/></w:pPr>${formatRunsToXml(contactLine, {
        size: 19 + fontSizeDelta,
        font: fontFamily,
        linkRegistry,
      })}</w:p>`
    );
  }

  // Helper section builders
  const appendWorkExperience = () => {
    const workExps = data.work_experience || [];
    if (workExps.length === 0) return;
    paragraphs.push(makeSectionHeader('WORK EXPERIENCE'));

    for (let cIndex = 0; cIndex < workExps.length; cIndex++) {
      const exp = workExps[cIndex];
      const hasIdenticalFirstRole =
        exp.roles?.length === 1 && exp.roles[0].title.toLowerCase().trim() === exp.company.toLowerCase().trim();

      paragraphs.push(
        makeTwoColumnLine(exp.company || '', exp.dates || '', {
          leftBold: true,
          leftSize: 21,
          rightSize: 19,
          spacingBefore: cIndex > 0 ? 80 : 40,
        })
      );

      const roles = exp.roles || [];
      for (let rIdx = 0; rIdx < roles.length; rIdx++) {
        const role = roles[rIdx];
        if (hasIdenticalFirstRole && rIdx === 0) {
          // Skip duplicate role line
        } else {
          const rightParts: string[] = [];
          if (role.dates && role.dates !== exp.dates) rightParts.push(role.dates);
          if (role.location) rightParts.push(role.location);
          const roleRightText = rightParts.join(' | ');

          const cleanLinkText = role.link ? ` [${getSemanticLinkLabel(role.link, 'Link')}](${role.link})` : '';
          const roleTitleText = (role.title || '') + cleanLinkText;

          paragraphs.push(
            makeTwoColumnLine(roleTitleText, roleRightText, {
              leftItalic: true,
              rightItalic: true,
              leftSize: 20,
              rightSize: 19,
            })
          );
        }

        if (Array.isArray(role.description)) {
          for (const desc of role.description) {
            if (desc && desc.trim()) {
              paragraphs.push(makeBulletItem(desc.trim(), 0, 3));
            }
          }
        }

        if (role.key_results && role.key_results.length > 0) {
          const keyResultsText = role.key_results.filter(Boolean).join('; ');
          if (keyResultsText.trim()) {
            paragraphs.push(makeLabeledSubBullet('Key Results', keyResultsText.trim(), 1, 3));
          }
        }

        if (role.technologies_used && role.technologies_used.length > 0) {
          const techText = role.technologies_used.filter(Boolean).join(', ');
          if (techText.trim()) {
            paragraphs.push(makeLabeledSubBullet('Technologies/Skills Used', techText.trim(), 1, 3));
          }
        }
      }
    }
  };

  const appendEducation = () => {
    const edus = data.education || [];
    if (edus.length === 0) return;
    paragraphs.push(makeSectionHeader('EDUCATION'));

    for (let eIndex = 0; eIndex < edus.length; eIndex++) {
      const edu = edus[eIndex];
      paragraphs.push(
        makeTwoColumnLine(edu.university || '', edu.graduation_date || '', {
          leftBold: true,
          leftSize: 21,
          rightSize: 19,
          spacingBefore: eIndex > 0 ? 80 : 40,
        })
      );

      const degreeMajor = [edu.degree, edu.major].filter(Boolean).join(', ');
      paragraphs.push(
        makeTwoColumnLine(degreeMajor, edu.location || '', {
          leftItalic: true,
          rightItalic: true,
          leftSize: 20,
          rightSize: 19,
        })
      );

      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        const honorsText = edu.honors_and_awards.filter(Boolean).join(', ');
        if (honorsText.trim()) {
          paragraphs.push(makeLabeledSubBullet('Honors & Awards', honorsText.trim(), 0, 1));
        }
      }

      if (edu.activities && edu.activities.length > 0) {
        const actText = edu.activities.filter(Boolean).join(', ');
        if (actText.trim()) {
          paragraphs.push(makeLabeledSubBullet('Activities', actText.trim(), 0, 1));
        }
      }
    }
  };

  const appendSkills = () => {
    const skills = data.skills_and_interests;
    const hasSkills =
      skills &&
      ((skills.certifications && skills.certifications.length > 0) ||
        (skills.technologies && skills.technologies.length > 0) ||
        (skills.skills && skills.skills.length > 0) ||
        (skills.interests && skills.interests.length > 0));

    if (!hasSkills) return;
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
  };

  const appendCustomSection = (sec: any) => {
    if (!sec || !sec.section_title) return;
    paragraphs.push(makeSectionHeader(sec.section_title));

    for (let i = 0; i < sec.items.length; i++) {
      const item = sec.items[i];
      const cleanProjLink = item.link ? ` [${getSemanticLinkLabel(item.link, 'Demo')}](${item.link})` : '';
      const titleText = (item.title || '') + cleanProjLink;

      paragraphs.push(
        makeTwoColumnLine(titleText, item.dates || '', {
          leftBold: true,
          leftSize: 21,
          rightSize: 19,
          spacingBefore: i > 0 ? 80 : 40,
        })
      );

      if (item.subtitle || item.location) {
        paragraphs.push(
          makeTwoColumnLine(item.subtitle || '', item.location || '', {
            leftItalic: true,
            rightItalic: true,
            leftSize: 20,
            rightSize: 19,
          })
        );
      }

      if (Array.isArray(item.description)) {
        for (const bullet of item.description) {
          if (bullet && bullet.trim()) {
            paragraphs.push(makeBulletItem(bullet.trim(), 0, 3));
          }
        }
      }
    }
  };

  // Render sections according to effective section order
  const sectionOrder = getEffectiveSectionOrder(data);

  for (const sectionId of sectionOrder) {
    if (sectionId === 'work_experience') {
      appendWorkExperience();
    } else if (sectionId === 'education') {
      appendEducation();
    } else if (sectionId === 'skills_and_interests') {
      appendSkills();
    } else {
      const customSec = (data.custom_sections || []).find((s) => s.id === sectionId);
      if (customSec) {
        appendCustomSection(customSec);
      }
    }
  }

  // Reconstruct the full word/document.xml with root tags and sectPr preserved
  const docStartMatch = originalXml.match(/^([\s\S]*?<w:body>)/);
  const docStart = docStartMatch
    ? docStartMatch[1]
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>';
  const docEnd = '</w:body></w:document>';

  const newXml = `${docStart}${paragraphs.join('')}${sectPrXml}${docEnd}`;

  zip.file('word/document.xml', newXml);

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
