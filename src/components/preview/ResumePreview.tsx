'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Scissors, 
  Zap, 
  Check, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useResumeStore, getEffectiveSectionOrder } from '@/store/resume-store';
import { useToast } from '@/components/ui/Toast';
import { PersonalInfoSection } from './PersonalInfoSection';
import { WorkExperienceSection } from './WorkExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { CustomSectionView } from './CustomSectionView';
import { AddSectionModal } from './AddSectionModal';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';

export function ResumePreview() {
  const { 
    resumeData, 
    templateSettings, 
    moveSection, 
    setActiveFormSection, 
    setSidebarTab,
    showPageBoundary,
    togglePageBoundary,
    fitToSinglePage,
    setPageFitPercent
  } = useResumeStore();
  const { addToast } = useToast();
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoScale, setAutoScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [paperHeight, setPaperHeight] = useState(0);

  // Responsive document viewport scale calculation
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.offsetWidth;
      const documentStandardWidth = 816; // 8.5in * 96px
      if (availableWidth < documentStandardWidth + 24) {
        const computed = Math.max(0.42, Number(((availableWidth - 16) / documentStandardWidth).toFixed(2)));
        setAutoScale(computed);
      } else {
        setAutoScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time height measurement relative to standard 11in page (1056px)
  useEffect(() => {
    const el = paperRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.scrollHeight || el.offsetHeight;
      setPaperHeight(h);
      const pct = Math.round((h / 1056) * 100);
      setPageFitPercent(pct);
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [resumeData, templateSettings, setPageFitPercent]);

  if (!resumeData) return null;

  const isOverflowing = paperHeight > 1056;
  const percentUsed = Math.round((paperHeight / 1056) * 100) || 0;
  const overflowPx = Math.max(0, paperHeight - 1056);
  const effectiveZoom = Number((autoScale * zoomLevel).toFixed(2));

  const handleFitToPage = () => {
    fitToSinglePage();
    addToast('Auto-tuned: Single-page margins & spacing applied', 'info');
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.6), 1.4));
  };

  const sectionOrder = getEffectiveSectionOrder(resumeData);

  // Compute typography
  const fontFamilies: Record<string, string> = {
    'Garamond': 'var(--font-serif), "EB Garamond", Garamond, Georgia, serif',
    'Times New Roman': '"Times New Roman", Times, Georgia, serif',
    'Georgia': 'Georgia, Cambria, serif',
    'Calibri': 'Calibri, Candara, "Segoe UI", Arial, sans-serif',
    'Arial': 'Arial, Helvetica, sans-serif',
  };
  const currentFontFamily = fontFamilies[templateSettings?.fontFamily] || fontFamilies['Garamond'];

  // Compute margins
  const margins = {
    compact: { top: '0.2in', bottom: '0.25in', left: '0.35in', right: '0.35in' },
    normal: { top: '0.125in', bottom: '0.29in', left: '0.5in', right: '0.5in' },
    spacious: { top: '0.4in', bottom: '0.4in', left: '0.75in', right: '0.75in' },
  }[templateSettings?.marginSize || 'normal'];

  // Compute font size
  const fontSizeClass = {
    compact: 'text-[9.5pt]',
    standard: 'text-[10pt]',
    spacious: 'text-[10.5pt]',
  }[templateSettings?.fontSize || 'standard'];

  // Compute line spacing
  const lineSpacingClass = {
    tight: 'leading-[1.18]',
    normal: 'leading-[1.25]',
    relaxed: 'leading-[1.4]',
  }[templateSettings?.lineSpacing || 'normal'];

  const accentColor = templateSettings?.accentColor || '#000000';

  const handleEditSection = (id: string) => {
    setActiveFormSection(id);
    setSidebarTab('forms');
  };

  const renderSection = (sectionId: string) => {
    if (sectionId === 'work_experience' && resumeData.work_experience && resumeData.work_experience.length > 0) {
      return <WorkExperienceSection data={resumeData.work_experience} />;
    }
    if (sectionId === 'education' && resumeData.education && resumeData.education.length > 0) {
      return <EducationSection data={resumeData.education} />;
    }
    if (sectionId === 'skills_and_interests' && resumeData.skills_and_interests) {
      return <SkillsSection data={resumeData.skills_and_interests} />;
    }

    // Custom Section
    const customSec = resumeData.custom_sections?.find(s => s.id === sectionId);
    if (customSec) {
      const idx = resumeData.custom_sections?.findIndex(s => s.id === sectionId) ?? 0;
      return <CustomSectionView section={customSec} sectionIndex={idx} />;
    }

    return null;
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full max-w-full">
      <style>{`
        .resume-paper h1,
        .resume-paper h2,
        .resume-paper .name-header,
        .resume-paper .section-header {
          border-bottom-color: ${accentColor} !important;
        }
      `}</style>

      {/* Neo-Brutalist Viewport Controls Bar */}
      <div className="w-full max-w-[8.5in] mb-4 flex items-center justify-between px-3.5 py-2 neo-box no-print text-xs font-mono gap-2">
        {/* Page Fit Indicator */}
        <div className="flex items-center gap-2">
          {isOverflowing ? (
            <div className="flex items-center gap-1.5 text-[#141413] bg-[#FF6B4A] px-2 py-0.5 border border-[#141413] font-black">
              <span>🚨 SPILL: {percentUsed}% / 1P (+{overflowPx}PX)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#141413] bg-[#D4FF00] px-2 py-0.5 border border-[#141413] font-black">
              <span>🔥 1-PAGE LOCK IN: {percentUsed}% DENSITY</span>
            </div>
          )}
        </div>

        {/* Actions & Zoom */}
        <div className="flex items-center gap-2">
          {isOverflowing && (
            <button
              type="button"
              onClick={handleFitToPage}
              className="neo-btn flex items-center gap-1 px-2.5 py-1 bg-[#FF6B4A] hover:bg-[#FF5530] text-[#141413] font-black tracking-wider uppercase transition-all cursor-pointer text-[11px]"
              title="Automatically tune margins, spacing, and font metrics to fit 1 page"
            >
              <Zap className="w-3.5 h-3.5 fill-[#141413] text-[#141413]" />
              <span>Auto-Fit 1P</span>
            </button>
          )}

          <button
            type="button"
            onClick={togglePageBoundary}
            className={`neo-btn flex items-center gap-1 px-2 py-1 transition-all cursor-pointer text-[11px] uppercase tracking-wider font-bold ${
              showPageBoundary 
                ? 'bg-[#141413] text-white' 
                : 'bg-white text-[#141413]'
            }`}
            title="Toggle print cutoff guide line"
          >
            {showPageBoundary ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span className="hidden sm:inline">Cutoff</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center border-2 border-[#141413] bg-white shadow-[1.5px_1.5px_0px_#141413] p-0.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.05)}
              disabled={zoomLevel <= 0.6}
              className="p-1 text-[#141413] hover:bg-[#F2EFE9] disabled:opacity-30 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1 text-[10px] font-black text-[#141413] hover:text-[#FF6B4A] cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(effectiveZoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.05)}
              disabled={zoomLevel >= 1.4}
              className="p-1 text-[#141413] hover:bg-[#F2EFE9] disabled:opacity-30 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Proportional Scaling Viewport Container */}
      <div 
        className="w-full flex justify-center transition-all duration-150 origin-top"
        style={{
          height: paperHeight ? `${Math.ceil(paperHeight * effectiveZoom) + 32}px` : undefined
        }}
      >
        <div
          className="origin-top shrink-0 transition-transform duration-150"
          style={{
            width: '816px',
            transform: `scale(${effectiveZoom})`,
          }}
        >
          <div 
            id="resume-paper-element"
            ref={paperRef}
            className={`bg-white resume-paper editorial-document-shadow border-2 border-[#141413] rounded-none font-serif text-black ${fontSizeClass} ${lineSpacingClass} relative transition-all`}
            style={{
              width: '8.5in', // 816px
              minHeight: '11in', // 1056px
              boxSizing: 'border-box',
              paddingTop: margins.top,
              paddingBottom: margins.bottom,
              paddingLeft: margins.left,
              paddingRight: margins.right,
              fontFamily: currentFontFamily,
            }}
          >
            {/* Visual 1-Page Cutoff Boundary Line (11in = 1056px) */}
            {showPageBoundary && isOverflowing && (
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none select-none no-print"
                style={{ top: '1056px' }}
              >
                <div className="w-full border-t-2 border-dashed border-[#141413] relative flex items-center justify-center">
                  <div className="bg-[#FF6B4A] text-[#141413] border-2 border-[#141413] shadow-[2px_2px_0px_#141413] px-3 py-1 font-mono text-[10px] tracking-wider uppercase font-black flex items-center gap-1.5 transform -translate-y-1/2">
                    <Scissors className="w-3.5 h-3.5 text-[#141413]" />
                    <span>🚨 1-PAGE CUTOFF • RECRUITERS STOP READING (SPILL: +{overflowPx}PX)</span>
                  </div>
                </div>
              </div>
            )}

            {showPageBoundary && !isOverflowing && (
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none select-none no-print opacity-80 hover:opacity-100 transition-opacity"
                style={{ top: '1056px' }}
              >
                <div className="w-full border-t-2 border-dashed border-[#141413] relative flex items-center justify-center">
                  <div className="bg-[#D4FF00] text-[#141413] border-2 border-[#141413] shadow-[2px_2px_0px_#141413] px-3 py-1 font-mono text-[10px] tracking-wider uppercase font-black flex items-center gap-1 transform -translate-y-1/2">
                    <Check className="w-3.5 h-3.5 text-[#141413]" />
                    <span>🔥 1-PAGE PERFECT FIT • ZERO SPILL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Header */}
            <div className="relative group/header-wrapper">
              <div className="absolute right-0 -top-2 opacity-0 group-hover/header-wrapper:opacity-100 flex items-center gap-1 bg-white border border-[#E7E4DC] px-1.5 py-0.5 z-20 transition-opacity no-print">
                <button
                  type="button"
                  onClick={() => handleEditSection('personal_info')}
                  className="flex items-center gap-1 font-mono text-[10px] uppercase text-[#55534E] hover:text-[#141413] cursor-pointer"
                  title="Edit info in panel"
                >
                  <Edit3 className="w-3 h-3 text-[#993322]" />
                  <span>Edit</span>
                </button>
              </div>
              <PersonalInfoSection data={resumeData.personal_info} />
            </div>

            {/* Dynamic Reorderable Sections */}
            {sectionOrder.map((sectionId, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === sectionOrder.length - 1;

              return (
                <div key={sectionId} className="relative group/section-wrapper">
                  {/* On-Canvas Hover Quick Reorder & Edit Bar */}
                  <div className="absolute right-0 -top-1 opacity-0 group-hover/section-wrapper:opacity-100 flex items-center gap-1 bg-white border border-[#E7E4DC] px-1 py-0.5 z-20 transition-opacity no-print">
                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'up')}
                      disabled={isFirst}
                      className="p-1 text-[#55534E] hover:text-[#141413] disabled:opacity-20 cursor-pointer"
                      title="Move Section Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'down')}
                      disabled={isLast}
                      className="p-1 text-[#55534E] hover:text-[#141413] disabled:opacity-20 cursor-pointer"
                      title="Move Section Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditSection(sectionId)}
                      className="p-1 text-[#55534E] hover:text-[#141413] cursor-pointer ml-0.5"
                      title="Edit in panel"
                    >
                      <Edit3 className="w-3 h-3 text-[#993322]" />
                    </button>
                  </div>

                  {renderSection(sectionId)}
                </div>
              );
            })}

            {/* Bottom Add Section Action */}
            <div className="pt-4 pb-2 border-t border-dashed border-[#E7E4DC] mt-4 text-center no-print">
              <button
                onClick={() => setIsAddSectionOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 font-mono text-[11px] tracking-wider uppercase font-semibold text-[#141413] hover:text-[#993322] bg-[#F8F7F4] hover:bg-white border border-[#E7E4DC] hover:border-[#141413] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Section (Projects, Publications, Awards)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
      />

      {/* Floating Action Button above mouse selection */}
      <FloatingSelectionToolbar />
    </div>
  );
}
