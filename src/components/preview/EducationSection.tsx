'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { EditableList } from './EditableList';
import { useResumeStore } from '@/store/resume-store';
import type { ResumeData } from '@/lib/schema';

interface EducationSectionProps {
  data: NonNullable<ResumeData['education']>;
}

export function EducationSection({ data }: EducationSectionProps) {
  const { updateField, addArrayItem, removeArrayItem } = useResumeStore();

  return (
    <div className="mb-2">
      <h2 className="text-[12pt] font-bold border-b border-black mb-1.5 mt-2.5 uppercase tracking-normal text-black pb-0.5">
        Education
      </h2>
      
      <div className="space-y-2">
        {data.map((edu, eIndex) => (
          <div key={eIndex} className="text-[10pt] leading-[1.25] text-black">
            <div className="flex justify-between items-baseline leading-tight">
              <EditableField
                value={edu.university}
                onSave={(val) => updateField(`education[${eIndex}].university`, val)}
                fieldPath={`education[${eIndex}].university`}
                as="h3"
                className="font-bold text-[12pt] text-black"
                containerClassName="flex-1 min-w-0"
              />
              <EditableField
                value={edu.graduation_date}
                onSave={(val) => updateField(`education[${eIndex}].graduation_date`, val)}
                fieldPath={`education[${eIndex}].graduation_date`}
                className="w-auto text-right whitespace-nowrap ml-4 shrink-0 font-normal text-[12pt] text-black"
                containerClassName="w-auto inline-flex items-center justify-end shrink-0"
              />
            </div>
            
            <div className="flex justify-between items-baseline mb-0.5 leading-tight">
              <div className="flex gap-1 italic text-[10pt] text-black">
                <EditableField
                  value={edu.degree}
                  onSave={(val) => updateField(`education[${eIndex}].degree`, val)}
                  fieldPath={`education[${eIndex}].degree`}
                  className="w-auto inline text-[10pt] italic"
                />
                {edu.major && (
                  <>
                    <span>, </span>
                    <EditableField
                      value={edu.major}
                      onSave={(val) => updateField(`education[${eIndex}].major`, val)}
                      fieldPath={`education[${eIndex}].major`}
                      className="w-auto inline text-[10pt] italic"
                    />
                  </>
                )}
              </div>
              {edu.location && (
                <EditableField
                  value={edu.location}
                  onSave={(val) => updateField(`education[${eIndex}].location`, val)}
                  fieldPath={`education[${eIndex}].location`}
                  className="w-auto text-right whitespace-nowrap ml-4 text-[10pt] italic font-normal text-black"
                  containerClassName="w-auto inline-flex items-center justify-end"
                />
              )}
            </div>

            {edu.honors_and_awards && edu.honors_and_awards.length > 0 && (
              <div className="ml-5 mt-0.5">
                <span className="font-bold mr-1">Honors & Awards:</span>
                <EditableField
                  value={edu.honors_and_awards.join(', ')}
                  onSave={(val) => updateField(`education[${eIndex}].honors_and_awards`, val.split(',').map(s => s.trim()))}
                  fieldPath={`education[${eIndex}].honors_and_awards`}
                  className="inline text-[10pt]"
                />
              </div>
            )}

            {edu.activities && edu.activities.length > 0 && (
              <div className="ml-5 mt-0.5">
                <span className="font-bold mr-1">Activities:</span>
                <EditableField
                  value={edu.activities.join(', ')}
                  onSave={(val) => updateField(`education[${eIndex}].activities`, val.split(',').map(s => s.trim()))}
                  fieldPath={`education[${eIndex}].activities`}
                  className="inline text-[10pt]"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
