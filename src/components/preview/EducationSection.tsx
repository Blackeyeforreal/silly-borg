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
    <div className="mb-6">
      <h2 className="text-lg font-bold border-b border-gray-900 mb-3 uppercase tracking-wider">Education</h2>
      
      <div className="space-y-4">
        {data.map((edu, eIndex) => (
          <div key={eIndex} className="text-sm">
            <div className="flex justify-between items-baseline">
              <EditableField
                value={edu.university}
                onSave={(val) => updateField(`education[${eIndex}].university`, val)}
                fieldPath={`education[${eIndex}].university`}
                as="h3"
                className="font-bold text-[15px]"
              />
              <EditableField
                value={edu.graduation_date}
                onSave={(val) => updateField(`education[${eIndex}].graduation_date`, val)}
                fieldPath={`education[${eIndex}].graduation_date`}
                className="w-auto text-right whitespace-nowrap ml-4"
              />
            </div>
            
            <div className="flex justify-between items-baseline mb-1">
              <div className="flex gap-1 italic">
                <EditableField
                  value={edu.degree}
                  onSave={(val) => updateField(`education[${eIndex}].degree`, val)}
                  fieldPath={`education[${eIndex}].degree`}
                  className="w-auto inline"
                />
                {edu.major && (
                  <>
                    <span>, </span>
                    <EditableField
                      value={edu.major}
                      onSave={(val) => updateField(`education[${eIndex}].major`, val)}
                      fieldPath={`education[${eIndex}].major`}
                      className="w-auto inline"
                    />
                  </>
                )}
              </div>
              {edu.location && (
                <EditableField
                  value={edu.location}
                  onSave={(val) => updateField(`education[${eIndex}].location`, val)}
                  fieldPath={`education[${eIndex}].location`}
                  className="w-auto text-right whitespace-nowrap ml-4"
                />
              )}
            </div>

            {edu.honors_and_awards && edu.honors_and_awards.length > 0 && (
              <EditableList
                items={edu.honors_and_awards}
                basePath={`education[${eIndex}].honors_and_awards`}
                onUpdate={(i, val) => updateField(`education[${eIndex}].honors_and_awards[${i}]`, val)}
                onAdd={(val) => addArrayItem(`education[${eIndex}].honors_and_awards`, val)}
                onRemove={(i) => removeArrayItem(`education[${eIndex}].honors_and_awards`, i)}
                label="Honors & Awards:"
              />
            )}

            {edu.activities && edu.activities.length > 0 && (
              <EditableList
                items={edu.activities}
                basePath={`education[${eIndex}].activities`}
                onUpdate={(i, val) => updateField(`education[${eIndex}].activities[${i}]`, val)}
                onAdd={(val) => addArrayItem(`education[${eIndex}].activities`, val)}
                onRemove={(i) => removeArrayItem(`education[${eIndex}].activities`, i)}
                label="Activities:"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
