'use client';

import React from 'react';
import { useResumeStore } from '@/store/resume-store';
import { PersonalInfoSection } from './PersonalInfoSection';
import { WorkExperienceSection } from './WorkExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';

export function ResumePreview() {
  const resumeData = useResumeStore((state) => state.resumeData);

  if (!resumeData) return null;

  return (
    <div 
      className="bg-white resume-paper shadow-2xl rounded-sm w-full font-serif text-black text-[10pt] leading-[1.25]"
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
    </div>
  );
}
