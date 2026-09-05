'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Scissors, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2
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
  const paperRef = useRef<HTMLDivElement>(null);
  const [paperHeight, setPaperHeight] = useState(0);

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

  const handleFitToPage = () => {
    fitToSinglePage();
    addToast('⚡ Auto-Tuned: Applied compact margins, tighter spacing, and optimal font scale to fit 1 page!', 'success');
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.7), 1.3));
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
    <div className="flex flex-col items-center w-full">
      <style>{`
        .resume-paper h1,
        .resume-paper h2,
        .resume-paper .name-header,
        .resume-paper .section-header {
          border-bottom-color: ${accentColor} !important;
        }
      `}</style>

      {/* Floating Canvas Top Bar: Page Capacity & Zoom */}
      <div className="w-full max-w-[8.5in] mb-4 flex items-center justify-between px-3.5 py-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xs no-print text-xs font-sans gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {isOverflowing ? (
            <div className="flex items-center gap-1.5 text-amber-900 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Spills to Page 2 ({percentUsed}% filled)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Fits 1 Page ({percentUsed}% filled)</span>
            </div>
          )}

          {/* Mini Capacity Bar */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  percentUsed > 100 ? 'bg-amber-500' : percentUsed > 90 ? 'bg-blue-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOverflowing && (
            <button
              type="button"
              onClick={handleFitToPage}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-xs transition-all cursor-pointer text-xs animate-pulse hover:animate-none"
              title="Automatically adjust margins, line spacing, and font scale to fit everything onto 1 page"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>Fit to 1 Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={togglePageBoundary}
            className={`flex items-center gap-1 px-2.5 py-1 border rounded-lg transition-colors cursor-pointer text-[11px] ${
              showPageBoundary 
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle visual 1-page cutoff boundary line"
          >
            {showPageBoundary ? <Eye className="w-3 h-3 text-blue-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            <span className="hidden md:inline">{showPageBoundary ? 'Cutoff: On' : 'Cutoff: Off'}</span>
          </button>

          {/* Zoom Level Pill */}
          <div className="hidden sm:flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => handleZoom(-0.05)}
              disabled={zoomLevel <= 0.7}
              className="p-1 text-slate-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-1.5 text-[10px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.05)}
              disabled={zoomLevel >= 1.3}
              className="p-1 text-slate-600 hover:bg-white rounded disabled:opacity-40 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Wrapper with Zoom Scaling */}
      <div 
        className="transition-transform duration-150 origin-top flex justify-center w-full"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <div 
          id="resume-paper-element"
          ref={paperRef}
          className={`bg-white resume-paper shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 rounded-xs font-serif text-black ${fontSizeClass} ${lineSpacingClass} relative transition-all shrink-0`}
          style={{
            width: '8.5in',
            maxWidth: '100%',
            minHeight: '11in',
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
              <div className="w-full border-t-2 border-dashed border-red-500/90 relative flex items-center justify-center">
                <div className="bg-red-50 text-red-900 border border-red-300 shadow-xs px-3 py-1 rounded-full text-[11px] font-sans font-bold flex items-center gap-1.5 transform -translate-y-1/2">
                  <Scissors className="w-3.5 h-3.5 text-red-600" />
                  <span>Page 1 Boundary (Spilling {overflowPx}px into Page 2)</span>
                </div>
              </div>
            </div>
          )}

          {showPageBoundary && !isOverflowing && (
            <div 
              className="absolute left-0 right-0 z-30 pointer-events-none select-none no-print opacity-60 hover:opacity-100 transition-opacity"
              style={{ top: '1056px' }}
            >
              <div className="w-full border-t border-dashed border-emerald-500/80 relative flex items-center justify-center">
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium flex items-center gap-1 transform -translate-y-1/2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>1-Page Limit (Fits cleanly within single page)</span>
                </div>
              </div>
            </div>
          )}

          {/* Personal Info Header */}
          <div className="relative group/header-wrapper">
            <div className="absolute right-0 -top-2 opacity-0 group-hover/header-wrapper:opacity-100 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs px-1.5 py-0.5 z-20 transition-opacity no-print">
              <button
                type="button"
                onClick={() => handleEditSection('personal_info')}
                className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-blue-600 px-1 py-0.5 rounded cursor-pointer"
                title="Edit Personal Info in Sidebar Form"
              >
                <Edit3 className="w-3 h-3 text-blue-600" />
                <span className="font-sans font-medium">Edit Info</span>
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
                <div className="absolute right-0 -top-1 opacity-0 group-hover/section-wrapper:opacity-100 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md shadow-xs px-1.5 py-0.5 z-20 transition-opacity no-print">
                  <button
                    type="button"
                    onClick={() => moveSection(sectionId, 'up')}
                    disabled={isFirst}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer"
                    title="Move Section Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(sectionId, 'down')}
                    disabled={isLast}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors cursor-pointer"
                    title="Move Section Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditSection(sectionId)}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer ml-0.5"
                    title="Edit in Sidebar Form"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>

                {renderSection(sectionId)}
              </div>
            );
          })}

          {/* Bottom Add Section Action */}
          <div className="pt-4 pb-2 border-t border-dashed border-slate-200 mt-4 text-center no-print">
            <button
              onClick={() => setIsAddSectionOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              Add Section (Projects, Publications, Awards, etc.)
            </button>
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
