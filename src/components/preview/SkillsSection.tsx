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
    <div className="mb-6">
      <h2 className="text-lg font-bold border-b border-gray-900 mb-3 uppercase tracking-wider">
        Certifications, Skills & Interests
      </h2>
      
      <ul className="list-disc ml-5 space-y-1 text-sm">
        {sections.map(({ label, key }) => {
          const items = data[key];
          if (!items || items.length === 0) return null;

          return (
            <li key={key} className="pl-1">
              <span className="font-bold mr-1">{label}:</span>
              <EditableField
                value={items.join(', ')}
                onSave={(val) => updateField(`skills_and_interests.${key}`, val.split(',').map(s => s.trim()))}
                fieldPath={`skills_and_interests.${key}`}
                className="inline"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
