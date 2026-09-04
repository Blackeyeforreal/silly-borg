'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { useResumeStore } from '@/store/resume-store';
import type { ResumeData } from '@/lib/schema';

interface SkillsSectionProps {
  data: NonNullable<ResumeData['skills_and_interests']>;
}

export function SkillsSection({ data }: SkillsSectionProps) {
  const updateField = useResumeStore(state => state.updateField);

  const sections = [
    { label: 'Certifications', key: 'certifications' as const },
    { label: 'Technologies', key: 'technologies' as const },
    { label: 'Skills', key: 'skills' as const },
    { label: 'Interests', key: 'interests' as const },
  ];

  return (
    <div className="mb-2">
      <h2 className="text-[12pt] font-bold border-b border-black mb-1.5 mt-2.5 uppercase tracking-normal text-black pb-0.5">
        Certifications, Skills &amp; Interests
      </h2>
      
      <ul className="list-disc ml-5 space-y-0.5 text-[10pt] leading-[1.25] text-black">
        {sections.map(({ label, key }) => {
          const items = data[key];
          if (!items || items.length === 0) return null;

          return (
            <li key={key} className="pl-1 text-[10pt]">
              <span className="font-bold mr-1 text-[10pt]">{label}:</span>
              <EditableField
                value={items.join(', ')}
                onSave={(val) => updateField(`skills_and_interests.${key}`, val.split(',').map(s => s.trim()))}
                fieldPath={`skills_and_interests.${key}`}
                className="inline text-[10pt]"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
