import type { ResumeData } from '../schema';
import { normalizeResumeData } from '../normalization/resume-normalizer';
import { RESUME_SPACING_PRESETS, RESUME_TYPOGRAPHY_PRESETS } from '../design-tokens';
import type { TemplateSettings } from '../../store/resume-store';

export interface PageSectionItem {
  type: 'personal_info' | 'work_experience' | 'education' | 'skills_and_interests' | 'custom_section';
  sectionId: string;
  title: string;
  // Sub-items if a section is split across pages (e.g. first 2 companies on Page 1, remaining on Page 2)
  items?: any[];
  isContinuation?: boolean;
}

export interface RenderPage {
  pageNumber: number;
  totalNumber: number;
  sections: PageSectionItem[];
  estimatedHeightPx: number;
  maxBudgetPx: number;
  fillRatio: number;
  fillPercentage: number;
}

export interface PaginationResult {
  pages: RenderPage[];
  totalPages: number;
  isSinglePageFit: boolean;
  recommendedSpacingPreset: 'compact' | 'normal' | 'spacious';
  fillRatio: number;
  fillPercentage: number;
}

/**
 * Estimates the vertical pixel height of each resume section on 816px wide letter paper.
 */
export function estimateSectionHeights(data: ResumeData, settings?: Partial<TemplateSettings>): Record<string, { totalHeight: number; itemHeights: number[] }> {
  const marginKey = settings?.marginSize || 'normal';
  const spacing = RESUME_SPACING_PRESETS[marginKey] || RESUME_SPACING_PRESETS.normal;
  const fontKey = settings?.fontSize || 'standard';
  const typo = RESUME_TYPOGRAPHY_PRESETS[fontKey]('Garamond');

  const result: Record<string, { totalHeight: number; itemHeights: number[] }> = {};

  // 1. Personal Info
  let headerHeight = 42; // Name
  if (data.personal_info?.contact) {
    headerHeight += 26; // Contact line + bottom border
  }
  headerHeight += spacing.headerBottomMargin;
  result['personal_info'] = { totalHeight: headerHeight, itemHeights: [headerHeight] };

  // Helper: Bullet line height estimate (approx 90 characters per line at ~10pt on 816px paper)
  const estimateBulletPx = (text: string) => {
    const chars = text.length;
    const lines = Math.max(1, Math.ceil(chars / 95));
    return Math.round(lines * (13 * typo.bodyLineHeight) + spacing.bulletGap);
  };

  // 2. Work Experience
  if (data.work_experience && data.work_experience.length > 0) {
    const headerH = 26 + spacing.sectionDividerMarginBottom; // "WORK EXPERIENCE" + border
    const itemHeights: number[] = [];
    let expTotal = headerH;

    for (const exp of data.work_experience) {
      let itemH = 20; // Company + dates line
      for (const r of exp.roles || []) {
        itemH += 18; // Role title + location/dates
        for (const b of r.description || []) {
          itemH += estimateBulletPx(b);
        }
        if (r.key_results && r.key_results.length > 0) {
          itemH += 22;
        }
        if (r.technologies_used && r.technologies_used.length > 0) {
          itemH += 20;
        }
        itemH += spacing.roleGap;
      }
      itemH += spacing.entryGap;
      itemHeights.push(itemH);
      expTotal += itemH;
    }

    result['work_experience'] = { totalHeight: expTotal, itemHeights };
  }

  // 3. Education
  if (data.education && data.education.length > 0) {
    const headerH = 26 + spacing.sectionDividerMarginBottom;
    const itemHeights: number[] = [];
    let eduTotal = headerH;

    for (const edu of data.education) {
      let itemH = 20; // University + graduation date
      itemH += 18; // Degree + major + location
      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        itemH += 18;
      }
      if (edu.activities && edu.activities.length > 0) {
        itemH += 18;
      }
      itemH += spacing.entryGap;
      itemHeights.push(itemH);
      eduTotal += itemH;
    }

    result['education'] = { totalHeight: eduTotal, itemHeights };
  }

  // 4. Skills & Interests
  if (data.skills_and_interests) {
    const s = data.skills_and_interests;
    const headerH = 26 + spacing.sectionDividerMarginBottom;
    let skillsH = headerH;

    const countCategories = [
      s.certifications?.length,
      s.technologies?.length,
      s.skills?.length,
      s.interests?.length
    ].filter(Boolean).length;

    const catHeight = countCategories * 24;
    skillsH += catHeight + spacing.sectionGap;
    result['skills_and_interests'] = { totalHeight: skillsH, itemHeights: [skillsH] };
  }

  // 5. Custom Sections (Projects)
  for (const sec of data.custom_sections || []) {
    const headerH = 26 + spacing.sectionDividerMarginBottom;
    const itemHeights: number[] = [];
    let secTotal = headerH;

    for (const item of sec.items || []) {
      let itemH = 20; // Project title + dates
      if (item.subtitle || item.location) itemH += 16;
      const itemDesc: any = item.description;
      const descList: string[] = Array.isArray(itemDesc)
        ? itemDesc
        : typeof itemDesc === 'string' && itemDesc.trim()
        ? [itemDesc.trim()]
        : [];
      for (const b of descList) {
        itemH += estimateBulletPx(b);
      }
      itemH += spacing.entryGap;
      itemHeights.push(itemH);
      secTotal += itemH;
    }

    result[sec.id] = { totalHeight: secTotal, itemHeights };
  }

  return result;
}

/**
 * Intelligent Multi-Page Partitioning Algorithm.
 * Partitions normalized resume data across discrete physical letter pages with:
 * - Orphan heading prevention
 * - Entry keep-with-first-bullet
 * - Natural 2-page balance (prevents Page 2 with 3 lonely bullets)
 * - Auto-tuning detection when content fits 1 page comfortably
 */
export function calculateResumePagination(
  rawResume: ResumeData,
  templateSettings?: Partial<TemplateSettings> & { autoTuneToSinglePage?: boolean },
  effectiveSectionOrder?: string[]
): PaginationResult {
  const resume = normalizeResumeData(rawResume);
  const marginKey = templateSettings?.marginSize || 'normal';
  const spacing = RESUME_SPACING_PRESETS[marginKey] || RESUME_SPACING_PRESETS.normal;

  // Physical Letter dimensions: 11in = 1056px at 96 DPI
  const letterPageHeightPx = 1056;
  const topPaddingPx = parseFloat(spacing.pagePaddingTop) * 96;
  const bottomPaddingPx = parseFloat(spacing.pagePaddingBottom) * 96;
  const usableHeightPx = letterPageHeightPx - (topPaddingPx + bottomPaddingPx);

  const sectionEstimates = estimateSectionHeights(resume, templateSettings);

  // Total content height calculation
  let totalContentHeightPx = sectionEstimates['personal_info']?.totalHeight || 70;
  const order = effectiveSectionOrder || resume.section_order || [
    'work_experience',
    'education',
    'skills_and_interests',
    ...(resume.custom_sections?.map((s) => s.id) || [])
  ];
  
  for (const sId of order) {
    if (sectionEstimates[sId]) {
      totalContentHeightPx += sectionEstimates[sId].totalHeight + spacing.sectionGap;
    }
  }

  // Check if content fits in 1 single page or can fit with compact preset
  const isDirectSinglePage = totalContentHeightPx <= usableHeightPx;
  const canFitSinglePageCompact = totalContentHeightPx <= usableHeightPx * 1.14; // Within 14% spillover threshold

  if (isDirectSinglePage) {
    const page1Sections: PageSectionItem[] = [
      { type: 'personal_info', sectionId: 'personal_info', title: 'Personal Info' }
    ];
    for (const sId of order) {
      if (sectionEstimates[sId]) {
        page1Sections.push(getSectionDescriptor(sId, resume));
      }
    }

    const fillRatio = Math.round((totalContentHeightPx / usableHeightPx) * 100) / 100;

    return {
      pages: [
        {
          pageNumber: 1,
          totalNumber: 1,
          sections: page1Sections,
          estimatedHeightPx: totalContentHeightPx,
          maxBudgetPx: usableHeightPx,
          fillRatio,
          fillPercentage: Math.round(fillRatio * 100),
        }
      ],
      totalPages: 1,
      isSinglePageFit: true,
      recommendedSpacingPreset: marginKey,
      fillRatio,
      fillPercentage: Math.round(fillRatio * 100),
    };
  }

  // If within 14% spillover AND autoTuneToSinglePage is requested, recommend compact preset to save paper & eliminate awkward 2-page spill!
  if (templateSettings?.autoTuneToSinglePage && canFitSinglePageCompact && templateSettings?.marginSize !== 'compact') {
    return calculateResumePagination(rawResume, { ...templateSettings, marginSize: 'compact', lineSpacing: 'tight', fontSize: 'compact', autoTuneToSinglePage: true }, order);
  }

  // Multi-Page Balance Partitioning (Senior 2-Page Resume)
  const pages: RenderPage[] = [];
  let currentPageNumber = 1;
  let currentSections: PageSectionItem[] = [
    { type: 'personal_info', sectionId: 'personal_info', title: 'Personal Info' }
  ];
  let currentHeight = sectionEstimates['personal_info']?.totalHeight || 70;

  const getRemainingContentHeight = (startIndex: number) => {
    let rem = 0;
    for (let k = startIndex; k < order.length; k++) {
      const kId = order[k];
      if (sectionEstimates[kId]) {
        rem += sectionEstimates[kId].totalHeight + spacing.sectionGap;
      }
    }
    return rem;
  };

  for (let i = 0; i < order.length; i++) {
    const sId = order[i];
    const secEstimate = sectionEstimates[sId];
    if (!secEstimate) continue;

    const secDesc = getSectionDescriptor(sId, resume);
    const secTotalH = secEstimate.totalHeight + spacing.sectionGap;
    const remainingAfterThis = getRemainingContentHeight(i + 1);

    // Natural 2-Page Balancing:
    // If total content exceeds 1 page and adding this section to Page 1 would starve Page 2
    // into an awkward lonely sliver (< 32% fill), and Page 1 already has solid substance (>= 50%),
    // start Page 2 here at this clean section boundary!
    const wouldStarvePage2 = remainingAfterThis > 0 && remainingAfterThis < (usableHeightPx * 0.32);
    const page1HasSolidSubstance = currentHeight >= (usableHeightPx * 0.50);

    if (currentPageNumber === 1 && wouldStarvePage2 && page1HasSolidSubstance) {
      const p1Ratio = Math.round((currentHeight / usableHeightPx) * 100) / 100;
      pages.push({
        pageNumber: 1,
        totalNumber: 2,
        sections: currentSections,
        estimatedHeightPx: currentHeight,
        maxBudgetPx: usableHeightPx,
        fillRatio: p1Ratio,
        fillPercentage: Math.round(p1Ratio * 100),
      });

      currentPageNumber = 2;
      currentSections = [secDesc];
      currentHeight = secTotalH;
      continue;
    }

    // Check if section fits fully in remaining space of current page
    if (currentHeight + secTotalH <= usableHeightPx) {
      currentSections.push(secDesc);
      currentHeight += secTotalH;
      continue;
    }

    // Section does NOT fit fully.
    // Check if section can be cleanly split by entries (e.g. work experience with 3+ companies)
    const headerHeight = 26 + spacing.sectionDividerMarginBottom;
    const remainingSpace = usableHeightPx - currentHeight;

    // Minimum requirement to place a section on current page: Header + At least 1 complete entry
    const firstItemHeight = secEstimate.itemHeights[0] || 60;
    const canFitHeaderAndFirstItem = remainingSpace >= (headerHeight + firstItemHeight);

    if (canFitHeaderAndFirstItem && secDesc.type === 'work_experience' && resume.work_experience && resume.work_experience.length > 1) {
      // Split experience entries across pages
      let fitCount = 0;
      let usedH = headerHeight;
      for (const itemH of secEstimate.itemHeights) {
        if (currentHeight + usedH + itemH <= usableHeightPx) {
          usedH += itemH;
          fitCount++;
        } else {
          break;
        }
      }

      if (fitCount > 0) {
        const page1Items = resume.work_experience.slice(0, fitCount);
        const page2Items = resume.work_experience.slice(fitCount);

        currentSections.push({
          ...secDesc,
          items: page1Items,
        });
        currentHeight += usedH;

        // Finish current page
        const p1Ratio = Math.round((currentHeight / usableHeightPx) * 100) / 100;
        pages.push({
          pageNumber: currentPageNumber,
          totalNumber: 2,
          sections: currentSections,
          estimatedHeightPx: currentHeight,
          maxBudgetPx: usableHeightPx,
          fillRatio: p1Ratio,
          fillPercentage: Math.round(p1Ratio * 100),
        });

        // Start Page 2
        currentPageNumber++;
        currentSections = [
          {
            ...secDesc,
            title: `${secDesc.title} (Continued)`,
            isContinuation: true,
            items: page2Items,
          }
        ];
        // Calculate Page 2 starting height
        currentHeight = headerHeight + secEstimate.itemHeights.slice(fitCount).reduce((a, b) => a + b, 0);
        continue;
      }
    }

    // Orphan Protection: Push entire section to next page if it cannot fit with its first entry!
    const pageRatio = Math.round((currentHeight / usableHeightPx) * 100) / 100;
    pages.push({
      pageNumber: currentPageNumber,
      totalNumber: 2,
      sections: currentSections,
      estimatedHeightPx: currentHeight,
      maxBudgetPx: usableHeightPx,
      fillRatio: pageRatio,
      fillPercentage: Math.round(pageRatio * 100),
    });

    currentPageNumber++;
    currentSections = [secDesc];
    currentHeight = secTotalH;
  }

  // Push final page
  if (currentSections.length > 0) {
    const lastPageRatio = Math.round((currentHeight / usableHeightPx) * 100) / 100;
    pages.push({
      pageNumber: currentPageNumber,
      totalNumber: currentPageNumber,
      sections: currentSections,
      estimatedHeightPx: currentHeight,
      maxBudgetPx: usableHeightPx,
      fillRatio: lastPageRatio,
      fillPercentage: Math.round(lastPageRatio * 100),
    });
  }

  // Update totalNumber on all pages
  const finalTotal = pages.length;
  pages.forEach(p => (p.totalNumber = finalTotal));

  const overallRatio = Math.round((totalContentHeightPx / (usableHeightPx * finalTotal)) * 100) / 100;

  return {
    pages,
    totalPages: finalTotal,
    isSinglePageFit: finalTotal === 1,
    recommendedSpacingPreset: marginKey,
    fillRatio: overallRatio,
    fillPercentage: Math.round(overallRatio * 100),
  };
}

function getSectionDescriptor(sectionId: string, data: ResumeData): PageSectionItem {
  if (sectionId === 'work_experience') {
    return { type: 'work_experience', sectionId, title: 'Work Experience', items: data.work_experience };
  }
  if (sectionId === 'education') {
    return { type: 'education', sectionId, title: 'Education', items: data.education };
  }
  if (sectionId === 'skills_and_interests') {
    return { type: 'skills_and_interests', sectionId, title: 'Certifications, Skills & Interests' };
  }
  const custom = (data.custom_sections || []).find(s => s.id === sectionId);
  return {
    type: 'custom_section',
    sectionId,
    title: custom?.section_title || 'Featured Projects',
    items: custom?.items
  };
}
