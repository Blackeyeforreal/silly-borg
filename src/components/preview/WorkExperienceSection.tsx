'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { EditableList } from './EditableList';
import { useResumeStore } from '@/store/resume-store';
import type { ResumeData } from '@/lib/schema';

interface WorkExperienceSectionProps {
  data: NonNullable<ResumeData['work_experience']>;
}

export function WorkExperienceSection({ data }: WorkExperienceSectionProps) {
  const { updateField, addArrayItem, removeArrayItem } = useResumeStore();

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold border-b border-gray-900 mb-3 uppercase tracking-wider">Work Experience</h2>
      
      <div className="space-y-5">
        {data.map((company, cIndex) => (
          <div key={cIndex} className="group/company">
            <div className="flex justify-between items-baseline mb-1">
              <EditableField
                value={company.company}
                onSave={(val) => updateField(`work_experience[${cIndex}].company`, val)}
                fieldPath={`work_experience[${cIndex}].company`}
                as="h3"
                className="font-bold text-base"
              />
              <EditableField
                value={company.dates}
                onSave={(val) => updateField(`work_experience[${cIndex}].dates`, val)}
                fieldPath={`work_experience[${cIndex}].dates`}
                className="text-sm w-auto text-right whitespace-nowrap ml-4"
              />
            </div>

            {company.roles.map((role, rIndex) => (
              <div key={rIndex} className="mb-3 last:mb-0">
                <div className="flex justify-between items-baseline mb-1">
                  <EditableField
                    value={role.title}
                    onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].title`, val)}
                    fieldPath={`work_experience[${cIndex}].roles[${rIndex}].title`}
                    className="italic font-semibold text-[15px]"
                  />
                  <div className="flex gap-2 text-sm ml-4">
                    {role.dates && (
                      <EditableField
                        value={role.dates}
                        onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].dates`, val)}
                        fieldPath={`work_experience[${cIndex}].roles[${rIndex}].dates`}
                        className="w-auto whitespace-nowrap"
                      />
                    )}
                    {role.location && (
                      <>
                        {role.dates && <span>|</span>}
                        <EditableField
                          value={role.location}
                          onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].location`, val)}
                          fieldPath={`work_experience[${cIndex}].roles[${rIndex}].location`}
                          className="w-auto whitespace-nowrap"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="text-sm">
                  <EditableList
                    items={role.description}
                    basePath={`work_experience[${cIndex}].roles[${rIndex}].description`}
                    onUpdate={(i, val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].description[${i}]`, val)}
                    onAdd={(val) => addArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, val)}
                    onRemove={(i) => removeArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, i)}
                    className="mb-1"
                  />
                  
                  {role.key_results && role.key_results.length > 0 && (
                    <EditableList
                      items={role.key_results}
                      basePath={`work_experience[${cIndex}].roles[${rIndex}].key_results`}
                      onUpdate={(i, val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].key_results[${i}]`, val)}
                      onAdd={(val) => addArrayItem(`work_experience[${cIndex}].roles[${rIndex}].key_results`, val)}
                      onRemove={(i) => removeArrayItem(`work_experience[${cIndex}].roles[${rIndex}].key_results`, i)}
                      label="Key Results:"
                    />
                  )}
                  
                  {role.technologies_used && role.technologies_used.length > 0 && (
                    <div className="ml-5 mt-1">
                      <span className="font-bold mr-1">Technologies/Skills Used:</span>
                      <EditableField
                        value={role.technologies_used.join(', ')}
                        onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].technologies_used`, val.split(',').map(s => s.trim()))}
                        fieldPath={`work_experience[${cIndex}].roles[${rIndex}].technologies_used`}
                        className="inline"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
