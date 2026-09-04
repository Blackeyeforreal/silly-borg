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
    <div className="mb-2">
      <h2 className="text-[12pt] font-bold border-b border-black mb-1.5 mt-2.5 uppercase tracking-normal text-black pb-0.5">
        Work Experience
      </h2>
      
      <div className="space-y-2.5">
        {data.map((company, cIndex) => (
          <div key={cIndex} className="group/company">
            <div className="flex justify-between items-baseline leading-tight">
              <EditableField
                value={company.company}
                onSave={(val) => updateField(`work_experience[${cIndex}].company`, val)}
                fieldPath={`work_experience[${cIndex}].company`}
                as="h3"
                className="font-bold text-[10.5pt] text-black"
                containerClassName="flex-1 min-w-0"
              />
              <EditableField
                value={company.dates}
                onSave={(val) => updateField(`work_experience[${cIndex}].dates`, val)}
                fieldPath={`work_experience[${cIndex}].dates`}
                className="text-[10pt] font-normal text-right whitespace-nowrap ml-4 shrink-0 text-black"
                containerClassName="w-auto inline-flex items-center justify-end shrink-0"
              />
            </div>

            {company.roles.map((role, rIndex) => (
              <div key={rIndex} className="mb-1.5 last:mb-0">
                <div className="flex justify-between items-baseline leading-tight mb-0.5">
                  <EditableField
                    value={role.title}
                    onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].title`, val)}
                    fieldPath={`work_experience[${cIndex}].roles[${rIndex}].title`}
                    className="italic font-normal text-[10pt] text-black"
                    containerClassName="flex-1 min-w-0"
                  />
                  <div className="flex gap-2 text-[10pt] italic font-normal text-black ml-4 shrink-0">
                    {role.dates && (
                      <EditableField
                        value={role.dates}
                        onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].dates`, val)}
                        fieldPath={`work_experience[${cIndex}].roles[${rIndex}].dates`}
                        className="w-auto whitespace-nowrap italic text-[10pt]"
                        containerClassName="w-auto inline-flex items-center"
                      />
                    )}
                    {role.location && (
                      <>
                        {role.dates && <span className="not-italic">|</span>}
                        <EditableField
                          value={role.location}
                          onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].location`, val)}
                          fieldPath={`work_experience[${cIndex}].roles[${rIndex}].location`}
                          className="w-auto whitespace-nowrap italic text-[10pt]"
                          containerClassName="w-auto inline-flex items-center"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="text-[10pt] leading-[1.25] text-black">
                  <EditableList
                    items={role.description}
                    basePath={`work_experience[${cIndex}].roles[${rIndex}].description`}
                    onUpdate={(i, val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].description[${i}]`, val)}
                    onAdd={(val) => addArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, val)}
                    onRemove={(i) => removeArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, i)}
                    className="mb-0.5"
                  />
                  
                  {role.key_results && role.key_results.length > 0 && (
                    <div className="ml-8 mt-0.5">
                      <span className="font-bold mr-1">Key Results:</span>
                      <EditableField
                        value={role.key_results.join('; ')}
                        onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].key_results`, val.split(';').map(s => s.trim()))}
                        fieldPath={`work_experience[${cIndex}].roles[${rIndex}].key_results`}
                        className="inline text-[10pt]"
                      />
                    </div>
                  )}
                  
                  {role.technologies_used && role.technologies_used.length > 0 && (
                    <div className="ml-8 mt-0.5">
                      <span className="font-bold mr-1">Technologies/Skills Used:</span>
                      <EditableField
                        value={role.technologies_used.join(', ')}
                        onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].technologies_used`, val.split(',').map(s => s.trim()))}
                        fieldPath={`work_experience[${cIndex}].roles[${rIndex}].technologies_used`}
                        className="inline text-[10pt]"
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
