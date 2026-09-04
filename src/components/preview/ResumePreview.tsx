'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { PersonalInfoSection } from './PersonalInfoSection';
import { WorkExperienceSection } from './WorkExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { CustomSectionView } from './CustomSectionView';
import { AddSectionModal } from './AddSectionModal';

export function ResumePreview() {
  const resumeData = useResumeStore((state) => state.resumeData);
  const templateSettings = useResumeStore((state) => state.templateSettings);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  if (!resumeData) return null;

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
        className={`bg-white resume-paper shadow-2xl rounded-sm w-full font-serif text-black ${fontSizeClass} ${lineSpacingClass} relative`}
        style={{
          maxWidth: '8.5in',
          minHeight: '11in',
          paddingTop: margins.top,
          paddingBottom: margins.bottom,
          paddingLeft: margins.left,
          paddingRight: margins.right,
          fontFamily: currentFontFamily,
        }}
      >
        <PersonalInfoSection data={resumeData.personal_info} />
        
        {resumeData.work_experience && resumeData.work_experience.length > 0 && (
          <WorkExperienceSection data={resumeData.work_experience} />
        )}
        
        {resumeData.education && resumeData.education.length > 0 && (
          <EducationSection data={resumeData.education} />
        )}
        
        {resumeData.skills_and_interests && (
          <SkillsSection data={resumeData.skills_and_interests} />
        )}

        {/* Custom Sections (e.g. Projects, Publications, Leadership, Awards) */}
        {resumeData.custom_sections && resumeData.custom_sections.map((section, idx) => (
          <CustomSectionView
            key={section.id}
            section={section}
            sectionIndex={idx}
          />
        ))}

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
    </>
  );
}
