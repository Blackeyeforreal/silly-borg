'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { useResumeStore } from '@/store/resume-store';
import type { ResumeData } from '@/lib/schema';
import { getSemanticLinkLabel } from '@/lib/normalization/resume-normalizer';

interface PersonalInfoSectionProps {
  data: ResumeData['personal_info'];
}

export function PersonalInfoSection({ data }: PersonalInfoSectionProps) {
  const updateField = useResumeStore(state => state.updateField);

  if (!data) return null;

  // Format link values into clean, elegant labels with full link URLs for clickable output
  const formatContactValue = (key: string, val?: string): string => {
    if (!val) return '';
    const trimmed = val.trim();

    if (key === 'portfolio') {
      if (trimmed.startsWith('[') && trimmed.includes('](')) return trimmed;
      const label = getSemanticLinkLabel(trimmed, 'Portfolio');
      return `[${label}](${trimmed})`;
    }

    if (key === 'linkedin') {
      if (trimmed.startsWith('[') && trimmed.includes('](')) return trimmed;
      return `[LinkedIn](${trimmed})`;
    }

    if (key === 'github') {
      if (trimmed.startsWith('[') && trimmed.includes('](')) return trimmed;
      return `[GitHub](${trimmed})`;
    }

    if (key === 'email') {
      if (trimmed.startsWith('[') && trimmed.includes('](')) return trimmed;
      return `[${trimmed}](mailto:${trimmed})`;
    }

    return trimmed;
  };

  const contactItems: { labelKey: string; displayValue: string; rawValue: string; path: string }[] = [];

  if (data.contact?.email) {
    contactItems.push({
      labelKey: 'email',
      displayValue: formatContactValue('email', data.contact.email),
      rawValue: data.contact.email,
      path: 'personal_info.contact.email'
    });
  }
  if (data.contact?.phone) {
    contactItems.push({
      labelKey: 'phone',
      displayValue: data.contact.phone.trim(),
      rawValue: data.contact.phone,
      path: 'personal_info.contact.phone'
    });
  }
  if (data.contact?.location) {
    contactItems.push({
      labelKey: 'location',
      displayValue: data.contact.location.trim(),
      rawValue: data.contact.location,
      path: 'personal_info.contact.location'
    });
  }
  if (data.contact?.portfolio) {
    contactItems.push({
      labelKey: 'portfolio',
      displayValue: formatContactValue('portfolio', data.contact.portfolio),
      rawValue: data.contact.portfolio,
      path: 'personal_info.contact.portfolio'
    });
  }
  if (data.contact?.linkedin) {
    contactItems.push({
      labelKey: 'linkedin',
      displayValue: formatContactValue('linkedin', data.contact.linkedin),
      rawValue: data.contact.linkedin,
      path: 'personal_info.contact.linkedin'
    });
  }
  if (data.contact?.github) {
    contactItems.push({
      labelKey: 'github',
      displayValue: formatContactValue('github', data.contact.github),
      rawValue: data.contact.github,
      path: 'personal_info.contact.github'
    });
  }
  if (data.contact?.links) {
    contactItems.push({
      labelKey: 'links',
      displayValue: data.contact.links.trim(),
      rawValue: data.contact.links,
      path: 'personal_info.contact.links'
    });
  }

  return (
    <header className="mb-2.5 text-left select-text">
      {/* Candidate Name */}
      <div className="border-b-2 border-[#141413] pb-1 mb-1.5 name-header">
        <EditableField
          value={data.full_name || ''}
          onSave={(val) => updateField('personal_info.full_name', val)}
          fieldPath="personal_info.full_name"
          as="h1"
          className="text-[24pt] font-bold tracking-tight text-[#141413] leading-none uppercase"
        />
      </div>
      
      {/* Contact Line with Semantic Link Labels & Subtle Separators */}
      <div 
        className="flex flex-wrap items-center text-[9.5pt] text-[#44423D] border-b border-[#141413] pb-1.5 mb-2 leading-normal gap-y-1"
      >
        {contactItems.map((item, index) => (
          <span 
            key={item.path} 
            className="inline-flex items-center whitespace-nowrap shrink-0"
          >
            {index > 0 && <span className="text-[#8C887B] select-none mx-2 font-normal">|</span>}
            <EditableField
              value={item.displayValue}
              onSave={(val) => updateField(item.path, val)}
              fieldPath={item.path}
              className="inline text-[9.5pt] whitespace-nowrap text-[#141413]"
              containerClassName="inline-flex items-center w-auto shrink-0"
            />
          </span>
        ))}
      </div>
    </header>
  );
}
