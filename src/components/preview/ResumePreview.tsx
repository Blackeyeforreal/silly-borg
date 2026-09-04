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
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);

  if (!resumeData) return null;

  return (
    <>
      <div 
        className="bg-white resume-paper shadow-2xl rounded-sm w-full font-serif text-black text-[10pt] leading-[1.25] relative"
        style={{
          maxWidth: '8.5in',
          minHeight: '11in',
          paddingTop: '0.125in',
          paddingBottom: '0.29in',
          paddingLeft: '0.5in',
          paddingRight: '0.5in',
          fontFamily: 'var(--font-serif), "EB Garamond", Garamond, Georgia, serif',
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
