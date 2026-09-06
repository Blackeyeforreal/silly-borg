/**
 * Unified Design Tokens for Editorial / Premium Technical Resume Typesetting.
 * Used consistently across preview components, pagination calculations, and PDF export.
 */

export interface ResumeSpacingTokens {
  pagePaddingTop: string;
  pagePaddingBottom: string;
  pagePaddingLeft: string;
  pagePaddingRight: string;
  sectionGap: number;        // px between major sections
  entryGap: number;          // px between companies / education items / projects
  roleGap: number;           // px between roles in same company
  bulletGap: number;         // px between consecutive bullets
  bulletIndent: number;      // px left indent for bullet items
  headerBottomMargin: number;// px under personal info bar
  sectionDividerMarginBottom: number; // px under section heading border
}

export interface ResumeTypographyTokens {
  fontFamily: string;
  nameSize: string;          // pt
  nameTracking: string;
  sectionHeadingSize: string;// pt
  sectionHeadingTracking: string;
  itemTitleSize: string;     // pt (Company, School, Project)
  itemSubTitleSize: string;  // pt (Role, Degree, Subtitle)
  bodySize: string;          // pt (Bullets, general text)
  bodyLineHeight: number;
  metaSize: string;          // pt (Dates, Locations)
  tagSize: string;           // pt (Technologies, Skills chips)
}

export interface ResumeThemeTokens {
  primaryText: string;
  secondaryText: string;
  mutedText: string;
  accentColor: string;
  linkText: string;
  linkUnderline: string;
  bulletColor: string;
  borderColor: string;
}

export const RESUME_THEME_TOKENS: ResumeThemeTokens = {
  primaryText: '#141413',      // Deep warm obsidian
  secondaryText: '#44423D',    // Readable neutral graphite
  mutedText: '#6C6962',        // Refined muted secondary
  accentColor: '#141413',      // Editorial divider line
  linkText: '#0B57D0',         // Refined digital blue
  linkUnderline: '#93B4ED',    // Subtle underline decoration
  bulletColor: '#2B2A27',      // Distinct bullet glyphs
  borderColor: '#141413',
};

export const RESUME_SPACING_PRESETS: Record<'compact' | 'normal' | 'spacious', ResumeSpacingTokens> = {
  compact: {
    pagePaddingTop: '0.45in',   // ~43px
    pagePaddingBottom: '0.45in',
    pagePaddingLeft: '0.55in',  // ~53px
    pagePaddingRight: '0.55in',
    sectionGap: 10,
    entryGap: 6,
    roleGap: 3,
    bulletGap: 2.5,
    bulletIndent: 16,
    headerBottomMargin: 6,
    sectionDividerMarginBottom: 4,
  },
  normal: {
    pagePaddingTop: '0.55in',   // ~53px
    pagePaddingBottom: '0.55in',
    pagePaddingLeft: '0.65in',  // ~62px
    pagePaddingRight: '0.65in',
    sectionGap: 14,
    entryGap: 8,
    roleGap: 4,
    bulletGap: 3.5,
    bulletIndent: 18,
    headerBottomMargin: 8,
    sectionDividerMarginBottom: 5,
  },
  spacious: {
    pagePaddingTop: '0.7in',    // ~67px
    pagePaddingBottom: '0.7in',
    pagePaddingLeft: '0.75in',  // ~72px
    pagePaddingRight: '0.75in',
    sectionGap: 18,
    entryGap: 10,
    roleGap: 5,
    bulletGap: 4.5,
    bulletIndent: 20,
    headerBottomMargin: 10,
    sectionDividerMarginBottom: 6,
  },
};

export const RESUME_TYPOGRAPHY_PRESETS: Record<'compact' | 'standard' | 'spacious', (fontFamily: string) => ResumeTypographyTokens> = {
  compact: (fontFamily: string) => ({
    fontFamily,
    nameSize: '21pt',
    nameTracking: '-0.02em',
    sectionHeadingSize: '10pt',
    sectionHeadingTracking: '0.04em',
    itemTitleSize: '10pt',
    itemSubTitleSize: '9.5pt',
    bodySize: '9.25pt',
    bodyLineHeight: 1.28,
    metaSize: '9pt',
    tagSize: '8.75pt',
  }),
  standard: (fontFamily: string) => ({
    fontFamily,
    nameSize: '23pt',
    nameTracking: '-0.015em',
    sectionHeadingSize: '10.5pt',
    sectionHeadingTracking: '0.05em',
    itemTitleSize: '10.5pt',
    itemSubTitleSize: '9.75pt',
    bodySize: '9.75pt',
    bodyLineHeight: 1.32,
    metaSize: '9.25pt',
    tagSize: '9pt',
  }),
  spacious: (fontFamily: string) => ({
    fontFamily,
    nameSize: '25pt',
    nameTracking: '-0.01em',
    sectionHeadingSize: '11pt',
    sectionHeadingTracking: '0.05em',
    itemTitleSize: '11pt',
    itemSubTitleSize: '10.25pt',
    bodySize: '10pt',
    bodyLineHeight: 1.36,
    metaSize: '9.5pt',
    tagSize: '9.25pt',
  }),
};
