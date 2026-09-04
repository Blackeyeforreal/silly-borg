'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { useResumeStore } from '@/store/resume-store';
import { Trash2 } from 'lucide-react';
import type { ResumeData } from '@/lib/schema';

interface SkillsSectionProps {
  data: NonNullable<ResumeData['skills_and_interests']>;
}

export function SkillsSection({ data }: SkillsSectionProps) {
  const { updateField, deleteBuiltinSection } = useResumeStore();

  const sections = [
    { label: 'Certifications', key: 'certifications' as const },
    { label: 'Technologies', key: 'technologies' as const },
    { label: 'Skills', key: 'skills' as const },
    { label: 'Interests', key: 'interests' as const },
  ];

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between border-b border-black mb-1.5 mt-2.5 pb-0.5 group/header section-header">
        <h2 className="text-[12pt] font-bold uppercase tracking-normal text-black">
          Certifications, Skills &amp; Interests
        </h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete the CERTIFICATIONS, SKILLS & INTERESTS section? You can re-add it anytime.')) {
              deleteBuiltinSection('skills_and_interests');
            }
          }}
          className="opacity-0 group-hover/header:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded text-xs flex items-center gap-1 transition-opacity no-print cursor-pointer"
          title="Delete Skills Section"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-sans">Delete Section</span>
        </button>
      </div>
      
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
