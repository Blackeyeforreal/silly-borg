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
    <div className="mb-6 text-center">
      <EditableField
        value={data.full_name || ''}
        onSave={(val) => updateField('personal_info.full_name', val)}
        fieldPath="personal_info.full_name"
        as="h1"
        className="text-3xl font-bold uppercase tracking-wider mb-2"
      />
      
      <div className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 text-sm border-b border-gray-900 pb-3 leading-relaxed">
        {contactItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-gray-400 select-none">|</span>}
            <EditableField
              value={item.value as string}
              onSave={(val) => updateField(item.path, val)}
              fieldPath={item.path}
              className="inline w-auto"
              containerClassName="inline-flex items-center w-auto"
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
