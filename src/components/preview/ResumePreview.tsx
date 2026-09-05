'use client';

import React, { useState } from 'react';
import { Plus, ArrowUp, ArrowDown, Edit3 } from 'lucide-react';
import { useResumeStore, getEffectiveSectionOrder } from '@/store/resume-store';
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
    setSidebarTab 
  } = useResumeStore();
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  if (!resumeData) return null;

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
    <>
      <style>{`
        .resume-paper h1,
        .resume-paper h2,
        .resume-paper .name-header,
        .resume-paper .section-header {
          border-bottom-color: ${accentColor} !important;
        }
      `}</style>
      <div 
        id="resume-paper-element"
        className={`bg-white resume-paper shadow-2xl rounded-sm font-serif text-black ${fontSizeClass} ${lineSpacingClass} relative transition-all shrink-0`}
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
        {/* Personal Info Header */}
        <div className="relative group/header-wrapper">
          <div className="absolute right-0 -top-2 opacity-0 group-hover/header-wrapper:opacity-100 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-gray-200 rounded-md shadow-xs px-1.5 py-0.5 z-20 transition-opacity no-print">
            <button
              type="button"
              onClick={() => handleEditSection('personal_info')}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-blue-600 px-1 py-0.5 rounded cursor-pointer"
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
              <div className="absolute right-0 -top-1 opacity-0 group-hover/section-wrapper:opacity-100 flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-gray-200 rounded-md shadow-xs px-1.5 py-0.5 z-20 transition-opacity no-print">
                <button
                  type="button"
                  onClick={() => moveSection(sectionId, 'up')}
                  disabled={isFirst}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors cursor-pointer"
                  title="Move Section Up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sectionId, 'down')}
                  disabled={isLast}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors cursor-pointer"
                  title="Move Section Down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditSection(sectionId)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors cursor-pointer ml-0.5"
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
        <div className="pt-4 pb-2 border-t border-dashed border-gray-200 mt-4 text-center no-print">
          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Section (Projects, Publications, Awards, etc.)
          </button>
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
      />

      {/* Floating Action Button above mouse selection */}
      <FloatingSelectionToolbar />
    </>
  );
}
