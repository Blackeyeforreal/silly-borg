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
      className="bg-white resume-paper shadow-2xl rounded-sm w-full font-serif text-gray-900"
      style={{
        maxWidth: '8.5in',
        minHeight: '11in',
        padding: '0.75in',
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
