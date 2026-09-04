'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { useResumeStore } from '@/store/resume-store';
import type { ResumeData } from '@/lib/schema';

interface PersonalInfoSectionProps {
  data: ResumeData['personal_info'];
}

export function PersonalInfoSection({ data }: PersonalInfoSectionProps) {
  const updateField = useResumeStore(state => state.updateField);

  if (!data) return null;

  const contactItems = [
    { value: data.contact?.email, path: 'personal_info.contact.email' },
    { value: data.contact?.phone, path: 'personal_info.contact.phone' },
    { value: data.contact?.location, path: 'personal_info.contact.location' },
    { value: data.contact?.links, path: 'personal_info.contact.links' }
  ].filter(item => item.value);

  return (
    <div className="mb-3 text-left">
      <div className="border-b border-black pb-0.5 mb-1">
        <EditableField
          value={data.full_name || ''}
          onSave={(val) => updateField('personal_info.full_name', val)}
          fieldPath="personal_info.full_name"
          as="h1"
          className="text-[24pt] font-bold tracking-tight text-black"
        />
      </div>
      
      <div className="flex flex-nowrap items-center text-[10pt] border-b border-black pb-1 mb-2 text-black leading-none whitespace-nowrap overflow-x-auto">
        {contactItems.map((item, index) => (
          <span key={index} className="inline-flex items-center whitespace-nowrap shrink-0">
            {index > 0 && <span className="text-black select-none mx-2 font-normal">|</span>}
            <EditableField
              value={item.value as string}
              onSave={(val) => updateField(item.path, val)}
              fieldPath={item.path}
              className="inline text-[10pt] whitespace-nowrap"
              containerClassName="inline-flex items-center w-auto shrink-0"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
