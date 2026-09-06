import { jsPDF } from 'jspdf';
import { ResumeData } from '@/lib/schema';
import { TemplateSettings, DEFAULT_TEMPLATE_SETTINGS, getEffectiveSectionOrder } from '@/store/resume-store';
import { normalizeResumeData, getSemanticLinkLabel } from '@/lib/normalization/resume-normalizer';
import { parseFormattedRuns, FormattedRun } from '@/lib/format-text';
import { calculateResumePagination, PageSectionItem } from '@/lib/pagination/pagination-engine';
import { RESUME_SPACING_PRESETS, RESUME_TYPOGRAPHY_PRESETS } from '@/lib/design-tokens';

export interface ServerPdfOptions {
  templateSettings?: Partial<TemplateSettings>;
}

function sanitizeUrl(raw: string): string {
  let clean = raw.trim();
  if (clean.includes('@') && !clean.startsWith('mailto:')) {
    return 'mailto:' + clean;
  }
  if (clean.startsWith('www.')) {
    return 'https://' + clean;
  }
  if (
    !clean.startsWith('http://') &&
    !clean.startsWith('https://') &&
    !clean.startsWith('mailto:') &&
    !clean.startsWith('tel:')
  ) {
    return 'https://' + clean;
  }
  return clean;
}

/**
 * Editorial Swiss-inspired server-side PDF generator for resumes using jsPDF in Node.js.
 * Built to achieve visual and structural parity with the React web preview:
 * - Direct integration with calculateResumePagination for consistent page allocation
 * - Unified design tokens (margins, spacing, typography sizes, colors)
 * - Precise box-model coordinate tracking with zero text/line overlap
 * - True hanging-indent bullet lists
 * - Left-aligned bold uppercase candidate name with thick rule
 * - Left-aligned wrapping contact row with semantic link labels and subtle dividers
 * - Interactive PDF hyperlink annotations for emails, profiles, and project links
 */
export async function generateResumePdfBuffer(
  rawResumeData: ResumeData,
  options?: ServerPdfOptions
): Promise<Buffer> {
  const data = normalizeResumeData(rawResumeData);
  const settings: TemplateSettings = {
    ...DEFAULT_TEMPLATE_SETTINGS,
    ...(options?.templateSettings || {}),
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter', // 612 x 792 pt
  });

  const pageWidth = 612;
  const pageHeight = 792;

  // 1. Spacing & Margin tokens (in points: 72pt = 1 inch)
  const marginKey = settings.marginSize || 'normal';
  const spacingTokens = RESUME_SPACING_PRESETS[marginKey] || RESUME_SPACING_PRESETS.normal;

  // Convert CSS inch values to points (1in = 72pt)
  const parseInchesToPt = (val: string, fallback: number) => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num * 72;
  };

  const marginLeft = parseInchesToPt(spacingTokens.pagePaddingLeft, 46.8);
  const marginRight = parseInchesToPt(spacingTokens.pagePaddingRight, 46.8);
  const marginTop = parseInchesToPt(spacingTokens.pagePaddingTop, 39.6);
  const marginBottom = parseInchesToPt(spacingTokens.pagePaddingBottom, 39.6);

  const contentWidth = pageWidth - marginLeft - marginRight;
  const bottomThreshold = pageHeight - marginBottom;

  // Spacing gaps in points
  const sectionGap = spacingTokens.sectionGap * 0.75;
  const entryGap = spacingTokens.entryGap * 0.75;
  const roleGap = spacingTokens.roleGap * 0.75;
  const bulletGap = spacingTokens.bulletGap * 0.75;
  const bulletIndent = spacingTokens.bulletIndent * 0.75; // ~13.5pt

  // 2. Typography tokens
  const fontKey = settings.fontSize || 'standard';
  const typoPreset = RESUME_TYPOGRAPHY_PRESETS[fontKey]('Garamond');

  const parsePt = (val: string, fallback: number) => {
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  };

  const nameSize = parsePt(typoPreset.nameSize, 24);
  const sectionHeadingSize = parsePt(typoPreset.sectionHeadingSize, 10.5);
  const itemTitleSize = parsePt(typoPreset.itemTitleSize, 10.5);
  const itemSubTitleSize = parsePt(typoPreset.itemSubTitleSize, 10);
  const bodySize = parsePt(typoPreset.bodySize, 9.75);
  const metaSize = parsePt(typoPreset.metaSize, 9.5);
  const subItemSize = parsePt(typoPreset.tagSize, 9.25);

  // Line spacing multiplier
  const lineSpacingMultiplier = {
    tight: 1.26,
    normal: 1.32,
    relaxed: 1.38,
  }[settings.lineSpacing || 'normal'];

  const bodyLineHeight = bodySize * lineSpacingMultiplier;

  // Font family resolution: jsPDF standard 14 core fonts
  const requestedFont = (settings.fontFamily || 'Garamond').toLowerCase();
  let baseFont = 'times';
  if (
    requestedFont.includes('sans') ||
    requestedFont.includes('arial') ||
    requestedFont.includes('helvetica') ||
    requestedFont.includes('calibri')
  ) {
    baseFont = 'helvetica';
  }

  // 3. Color Palette tokens
  let accentHex = (settings.accentColor || '#141413').replace('#', '').trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(accentHex)) accentHex = '141413';
  const rAcc = parseInt(accentHex.substring(0, 2), 16);
  const gAcc = parseInt(accentHex.substring(2, 4), 16);
  const bAcc = parseInt(accentHex.substring(4, 6), 16);

  // Deep Obsidian for text and primary borders
  const rPrimary = 20, gPrimary = 20, bPrimary = 19;     // #141413
  // Secondary Graphite for dates, locations, subtitles
  const rSecondary = 68, gSecondary = 66, bSecondary = 61; // #44423D
  // Digital Blue for hyperlinks
  const rLink = 11, gLink = 87, bLink = 208;              // #0B57D0
  // Subtle blue for link underlines
  const rLinkUnderline = 147, gLinkUnderline = 180, bLinkUnderline = 237; // #93B4ED
  // Bullet & Key results text
  const rBullet = 43, gBullet = 42, bBullet = 39;          // #2B2A27
  // Contact separator pipe
  const rSep = 140, gSep = 136, bSep = 123;                // #8C887B

  let currentY = marginTop;

  function ensurePageSpace(requiredHeight: number) {
    if (currentY + requiredHeight > bottomThreshold) {
      doc.addPage();
      currentY = marginTop;
    }
  }

  function drawLine(y: number, r = rPrimary, g = gPrimary, b = bPrimary, lineWidth = 0.75) {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(lineWidth);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
  }

  // 4. Word-wrapped text paragraph renderer with hanging-indent & markdown formatting
  // Strict box-model: currentY is top of line box, baselineY = currentY + fontSize * 0.82
  function renderFormattedParagraph(
    runs: FormattedRun[],
    startX: number,
    maxWidth: number,
    lineHeight: number,
    fontSize: number,
    bulletConfig?: { glyph: string; glyphX: number }
  ) {
    interface WordToken {
      text: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      linkUrl?: string;
    }

    const words: WordToken[] = [];
    for (const r of runs) {
      const parts = r.text.split(/(\s+)/);
      for (const p of parts) {
        if (!p) continue;
        words.push({
          text: p,
          bold: r.bold,
          italic: r.italic,
          underline: r.underline,
          linkUrl: r.linkUrl,
        });
      }
    }

    let lineWords: WordToken[] = [];
    let currentLineWidth = 0;
    let isFirstLineOfBullet = true;

    const flushLine = () => {
      if (lineWords.length === 0) return;
      ensurePageSpace(lineHeight);

      const baselineY = currentY + fontSize * 0.82;

      // Draw hanging bullet on first line if configured
      if (isFirstLineOfBullet && bulletConfig) {
        doc.setFont(baseFont, 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(rBullet, gBullet, bBullet);
        doc.text(bulletConfig.glyph, bulletConfig.glyphX, baselineY);
        isFirstLineOfBullet = false;
      }

      let tokenX = startX;
      for (const w of lineWords) {
        let style = 'normal';
        if (w.bold && w.italic) style = 'bolditalic';
        else if (w.bold) style = 'bold';
        else if (w.italic) style = 'italic';

        doc.setFont(baseFont, style);
        doc.setFontSize(fontSize);

        const isLink = !!w.linkUrl;
        if (isLink) {
          doc.setTextColor(rLink, gLink, bLink);
        } else {
          doc.setTextColor(rPrimary, gPrimary, bPrimary);
        }

        doc.text(w.text, tokenX, baselineY);
        const wWidth = doc.getTextWidth(w.text);

        if (isLink && w.linkUrl && w.text.trim().length > 0) {
          const cleanLink = sanitizeUrl(w.linkUrl);
          doc.link(tokenX, baselineY - fontSize * 0.82, wWidth, fontSize * 1.05, { url: cleanLink });
          doc.setDrawColor(rLinkUnderline, gLinkUnderline, bLinkUnderline);
          doc.setLineWidth(0.5);
          doc.line(tokenX, baselineY + 1.2, tokenX + wWidth, baselineY + 1.2);
        }

        tokenX += wWidth;
      }

      currentY += lineHeight;
      lineWords = [];
      currentLineWidth = 0;
    };

    for (const w of words) {
      let style = 'normal';
      if (w.bold && w.italic) style = 'bolditalic';
      else if (w.bold) style = 'bold';
      else if (w.italic) style = 'italic';

      doc.setFont(baseFont, style);
      doc.setFontSize(fontSize);
      const wWidth = doc.getTextWidth(w.text);

      if (currentLineWidth + wWidth > maxWidth && lineWords.length > 0 && w.text.trim().length > 0) {
        flushLine();
      }

      lineWords.push(w);
      currentLineWidth += wWidth;
    }

    flushLine();
  }

  // 5. Section Header Renderer (UPPERCASE, Bold, with underline)
  function renderSectionHeader(title: string) {
    const headerHeight = sectionHeadingSize * 1.3;
    ensurePageSpace(headerHeight + 12);

    const baselineY = currentY + sectionHeadingSize * 0.82;
    doc.setFont(baseFont, 'bold');
    doc.setFontSize(sectionHeadingSize);
    doc.setTextColor(rAcc, gAcc, bAcc);
    doc.text(title.toUpperCase(), marginLeft, baselineY);

    const lineY = currentY + headerHeight;
    drawLine(lineY, rAcc, gAcc, bAcc, 0.75);

    currentY = lineY + Math.max(5, spacingTokens.sectionDividerMarginBottom * 0.75);
  }

  // 6. Two-Column Entry Header Line (Company/School/Project + Dates/Location)
  function renderTwoColumnLine(
    leftText: string,
    rightText: string,
    leftBold = true,
    leftItalic = false,
    rightItalic = false,
    leftLinkUrl?: string
  ) {
    const leftFontSize = leftBold ? itemTitleSize : itemSubTitleSize;
    const lineHeight = Math.max(leftFontSize, metaSize) * 1.35;
    ensurePageSpace(lineHeight);

    const baselineY = currentY + leftFontSize * 0.82;

    let leftStyle = 'normal';
    if (leftBold && leftItalic) leftStyle = 'bolditalic';
    else if (leftBold) leftStyle = 'bold';
    else if (leftItalic) leftStyle = 'italic';

    doc.setFont(baseFont, leftStyle);
    doc.setFontSize(leftFontSize);

    if (leftLinkUrl) {
      doc.setTextColor(rLink, gLink, bLink);
      doc.text(leftText, marginLeft, baselineY);
      const w = doc.getTextWidth(leftText);
      doc.link(marginLeft, baselineY - leftFontSize * 0.82, w, leftFontSize * 1.05, { url: sanitizeUrl(leftLinkUrl) });
      doc.setDrawColor(rLinkUnderline, gLinkUnderline, bLinkUnderline);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, baselineY + 1.2, marginLeft + w, baselineY + 1.2);
    } else {
      doc.setTextColor(rPrimary, gPrimary, bPrimary);
      doc.text(leftText, marginLeft, baselineY);
    }

    if (rightText) {
      doc.setFont(baseFont, rightItalic ? 'italic' : 'normal');
      doc.setFontSize(metaSize);
      doc.setTextColor(rSecondary, gSecondary, bSecondary);
      const rightBaselineY = currentY + metaSize * 0.82;
      doc.text(rightText, pageWidth - marginRight, rightBaselineY, { align: 'right' });
    }

    currentY += lineHeight;
  }

  // 7. Bullet Point with true hanging indent
  function renderBullet(text: string) {
    const runs = parseFormattedRuns(text);
    renderFormattedParagraph(
      runs,
      marginLeft + bulletIndent,
      contentWidth - bulletIndent,
      bodyLineHeight,
      bodySize,
      { glyph: '•', glyphX: marginLeft + 4 }
    );
    currentY += bulletGap;
  }

  // 8. Labeled Sub-bullet (Key Results, Technologies Used, Honors & Awards)
  function renderLabeledSubBullet(label: string, text: string, labelColor = rPrimary, textColor = rSecondary) {
    const runs: FormattedRun[] = [
      { text: `${label}: `, bold: true },
      ...parseFormattedRuns(text),
    ];
    const subIndent = bulletIndent + 4;
    renderFormattedParagraph(
      runs,
      marginLeft + subIndent,
      contentWidth - subIndent,
      subItemSize * 1.3,
      subItemSize
    );
    currentY += 2;
  }

  // 9. Personal Info Header (Name + Contact Row)
  function renderPersonalInfo() {
    // A. Candidate Name: Left-aligned, UPPERCASE, bold, with thick bottom border
    if (data.personal_info?.full_name) {
      const nameHeight = nameSize * 1.15;
      ensurePageSpace(nameHeight + 14);

      const baselineY = currentY + nameSize * 0.82;
      doc.setFont(baseFont, 'bold');
      doc.setFontSize(nameSize);
      doc.setTextColor(rAcc, gAcc, bAcc);
      const upperName = data.personal_info.full_name.toUpperCase();
      doc.text(upperName, marginLeft, baselineY);

      const lineY = currentY + nameHeight;
      drawLine(lineY, rAcc, gAcc, bAcc, 1.5); // Thick 1.5pt rule
      currentY = lineY + 6;
    }

    // B. Contact Row: Left-aligned with subtle pipe separators and semantic links
    const contact = data.personal_info?.contact;
    const contactItems: { text: string; linkUrl?: string }[] = [];

    if (contact?.email) {
      contactItems.push({ text: contact.email, linkUrl: sanitizeUrl(contact.email) });
    }
    if (contact?.phone) {
      contactItems.push({ text: contact.phone.trim() });
    }
    if (contact?.location) {
      contactItems.push({ text: contact.location.trim() });
    }
    if (contact?.portfolio) {
      const label = getSemanticLinkLabel(contact.portfolio, 'Portfolio');
      contactItems.push({ text: label, linkUrl: sanitizeUrl(contact.portfolio) });
    }
    if (contact?.linkedin) {
      const label = getSemanticLinkLabel(contact.linkedin, 'LinkedIn');
      contactItems.push({ text: label, linkUrl: sanitizeUrl(contact.linkedin) });
    }
    if (contact?.github) {
      const label = getSemanticLinkLabel(contact.github, 'GitHub');
      contactItems.push({ text: label, linkUrl: sanitizeUrl(contact.github) });
    }
    if (contact?.links) {
      contactItems.push({ text: contact.links.trim() });
    }

    if (contactItems.length > 0) {
      const contactLineHeight = metaSize * 1.35;
      ensurePageSpace(contactLineHeight + 10);

      doc.setFont(baseFont, 'normal');
      doc.setFontSize(metaSize);

      const separator = ' | ';
      const sepWidth = doc.getTextWidth(separator);

      let lineX = marginLeft;
      for (let i = 0; i < contactItems.length; i++) {
        const item = contactItems[i];
        const itemWidth = doc.getTextWidth(item.text);

        // Wrap to next line if contact row exceeds available width
        if (lineX + itemWidth > pageWidth - marginRight && lineX > marginLeft) {
          currentY += contactLineHeight;
          ensurePageSpace(contactLineHeight + 8);
          lineX = marginLeft;
        }

        const baselineY = currentY + metaSize * 0.82;

        if (item.linkUrl) {
          doc.setTextColor(rLink, gLink, bLink);
          doc.text(item.text, lineX, baselineY);
          doc.link(lineX, baselineY - metaSize * 0.82, itemWidth, metaSize * 1.05, { url: item.linkUrl });
          doc.setDrawColor(rLinkUnderline, gLinkUnderline, bLinkUnderline);
          doc.setLineWidth(0.5);
          doc.line(lineX, baselineY + 1.2, lineX + itemWidth, baselineY + 1.2);
        } else {
          doc.setTextColor(rSecondary, gSecondary, bSecondary);
          doc.text(item.text, lineX, baselineY);
        }

        lineX += itemWidth;

        if (i < contactItems.length - 1) {
          if (lineX + sepWidth <= pageWidth - marginRight) {
            doc.setTextColor(rSep, gSep, bSep);
            doc.text(separator, lineX, baselineY);
            lineX += sepWidth;
          }
        }
      }

      currentY += contactLineHeight + 3;
      drawLine(currentY, rPrimary, gPrimary, bPrimary, 0.5);
      currentY += Math.max(5, spacingTokens.headerBottomMargin * 0.75);
    }
  }

  // 10. Work Experience Section Renderer
  function renderWorkExperience(items?: any[], isContinuation = false, customTitle = 'Work Experience') {
    const exps = items || data.work_experience || [];
    if (exps.length === 0) return;

    renderSectionHeader(customTitle);

    for (let cIdx = 0; cIdx < exps.length; cIdx++) {
      const exp = exps[cIdx];
      if (cIdx > 0) currentY += entryGap;

      renderTwoColumnLine(exp.company || '', exp.dates || '', true, false, false);
      currentY += 1;

      const roles = exp.roles || [];
      const hasIdenticalFirstRole =
        roles.length === 1 && roles[0].title.toLowerCase().trim() === exp.company.toLowerCase().trim();

      for (let rIdx = 0; rIdx < roles.length; rIdx++) {
        const role = roles[rIdx];
        if (rIdx > 0) currentY += roleGap;

        if (!(hasIdenticalFirstRole && rIdx === 0)) {
          const rightParts: string[] = [];
          if (role.location) rightParts.push(role.location);
          if (role.dates && role.dates !== exp.dates) rightParts.push(role.dates);

          const roleTitle = role.title || '';
          renderTwoColumnLine(roleTitle, rightParts.join(' | '), false, true, true, role.link);
          currentY += 2; // Breathing room before first bullet
        }

        if (Array.isArray(role.description)) {
          for (const bullet of role.description) {
            if (bullet?.trim()) {
              renderBullet(bullet.trim());
            }
          }
        }

        if (role.key_results && role.key_results.length > 0) {
          const krText = role.key_results.filter(Boolean).join('; ');
          if (krText.trim()) {
            renderLabeledSubBullet('Key Results', krText.trim(), rPrimary, rBullet);
          }
        }

        if (role.technologies_used && role.technologies_used.length > 0) {
          const techText = role.technologies_used.filter(Boolean).join(', ');
          if (techText.trim()) {
            renderLabeledSubBullet('Technologies/Skills Used', techText.trim(), rPrimary, rSecondary);
          }
        }
      }
    }
  }

  // 11. Education Section Renderer
  function renderEducation(items?: any[], isContinuation = false, customTitle = 'Education') {
    const edus = items || data.education || [];
    if (edus.length === 0) return;

    renderSectionHeader(customTitle);

    for (let eIdx = 0; eIdx < edus.length; eIdx++) {
      const edu = edus[eIdx];
      if (eIdx > 0) currentY += entryGap;

      renderTwoColumnLine(edu.university || '', edu.graduation_date || '', true, false, false);
      currentY += 1;

      const degreeMajor = [edu.degree, edu.major].filter(Boolean).join(', ');
      renderTwoColumnLine(degreeMajor, edu.location || '', false, true, true);
      currentY += 2;

      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        renderLabeledSubBullet('Honors & Awards', edu.honors_and_awards.filter(Boolean).join(', '), rPrimary, rBullet);
      }

      if (edu.activities && edu.activities.length > 0) {
        renderLabeledSubBullet('Activities', edu.activities.filter(Boolean).join(', '), rPrimary, rSecondary);
      }
    }
  }

  // 12. Skills & Interests Section Renderer (Bulleted list matching preview)
  function renderSkills(isContinuation = false, customTitle = 'Certifications, Skills & Interests') {
    const s = data.skills_and_interests;
    const categories = [
      { label: 'Certifications', items: s?.certifications },
      { label: 'Technologies', items: s?.technologies },
      { label: 'Skills', items: s?.skills },
      { label: 'Interests', items: s?.interests },
    ].filter(cat => cat.items && cat.items.length > 0);

    if (categories.length === 0) return;

    renderSectionHeader(customTitle);

    for (const cat of categories) {
      const text = (cat.items || []).filter(Boolean).join(', ');
      if (!text.trim()) continue;

      const runs: FormattedRun[] = [
        { text: `${cat.label}: `, bold: true },
        ...parseFormattedRuns(text),
      ];

      renderFormattedParagraph(
        runs,
        marginLeft + bulletIndent,
        contentWidth - bulletIndent,
        bodyLineHeight,
        bodySize,
        { glyph: '•', glyphX: marginLeft + 4 }
      );
      currentY += bulletGap;
    }
  }

  // 13. Custom Section Renderer (Projects, Publications, Awards)
  function renderCustomSection(
    sectionId: string,
    items?: any[],
    isContinuation = false,
    customTitle?: string
  ) {
    const sec = (data.custom_sections || []).find(s => s.id === sectionId);
    if (!sec && !items) return;

    const title = customTitle || sec?.section_title || 'Featured Projects';
    const sectionItems = items || sec?.items || [];
    if (sectionItems.length === 0) return;

    renderSectionHeader(title);

    for (let i = 0; i < sectionItems.length; i++) {
      const item = sectionItems[i];
      if (i > 0) currentY += entryGap;

      renderTwoColumnLine(item.title || '', item.dates || '', true, false, false, item.link);
      currentY += 1;

      if (item.subtitle || item.location) {
        renderTwoColumnLine(item.subtitle || '', item.location || '', false, true, true);
        currentY += 2; // Breathing room before description bullets
      }

      const itemDesc = item.description;
      const descList: string[] = Array.isArray(itemDesc)
        ? itemDesc
        : typeof itemDesc === 'string' && itemDesc.trim()
        ? [itemDesc.trim()]
        : [];

      for (const bullet of descList) {
        if (bullet?.trim()) {
          renderBullet(bullet.trim());
        }
      }
    }
  }

  // 14. Master Document Partitioning & Execution
  // Integrate directly with calculateResumePagination to guarantee identical page splits
  const sectionOrder = getEffectiveSectionOrder(data);
  const pagination = calculateResumePagination(data, settings, sectionOrder);

  for (let pIdx = 0; pIdx < pagination.pages.length; pIdx++) {
    const page = pagination.pages[pIdx];

    if (pIdx > 0) {
      if (doc.getNumberOfPages() <= pIdx) {
        doc.addPage();
      }
      doc.setPage(pIdx + 1);
      currentY = marginTop;
    }

    for (let sIdx = 0; sIdx < page.sections.length; sIdx++) {
      const secItem = page.sections[sIdx];

      // Add sectionGap before subsequent sections on the same page
      if (sIdx > 0 && currentY > marginTop) {
        currentY += sectionGap;
      }

      if (secItem.type === 'personal_info') {
        renderPersonalInfo();
      } else if (secItem.type === 'work_experience') {
        renderWorkExperience(secItem.items, secItem.isContinuation, secItem.title);
      } else if (secItem.type === 'education') {
        renderEducation(secItem.items, secItem.isContinuation, secItem.title);
      } else if (secItem.type === 'skills_and_interests') {
        renderSkills(secItem.isContinuation, secItem.title);
      } else if (secItem.type === 'custom_section') {
        renderCustomSection(secItem.sectionId, secItem.items, secItem.isContinuation, secItem.title);
      }
    }
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
