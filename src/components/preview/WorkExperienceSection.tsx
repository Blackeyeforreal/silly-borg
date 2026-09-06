'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { EditableList } from './EditableList';
import { useResumeStore } from '@/store/resume-store';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import type { ResumeData } from '@/lib/schema';
import { getSemanticLinkLabel } from '@/lib/normalization/resume-normalizer';

interface WorkExperienceSectionProps {
  data: NonNullable<ResumeData['work_experience']>;
}

export function WorkExperienceSection({ data }: WorkExperienceSectionProps) {
  const { 
    updateField, 
    addArrayItem, 
    removeArrayItem, 
    deleteBuiltinSection, 
    addWorkExperienceEntry, 
    removeWorkExperienceEntry 
  } = useResumeStore();

  return (
    <section className="mb-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#141413] mb-2 mt-2 pb-0.5 group/header section-header">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-[0.05em] text-[#141413]">
          Work Experience
        </h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete the WORK EXPERIENCE section? You can re-add it anytime.')) {
              deleteBuiltinSection('work_experience');
            }
          }}
          className="opacity-0 group-hover/header:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded text-xs flex items-center gap-1 transition-opacity no-print cursor-pointer"
          title="Delete Work Experience Section"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-sans">Delete Section</span>
        </button>
      </div>
      
      <div className="space-y-2.5">
        {data.map((company, cIndex) => {
          // Check if the first role's title is identical to the company name
          const hasIdenticalFirstRole = company.roles?.length === 1 && 
            company.roles[0].title.toLowerCase().trim() === company.company.toLowerCase().trim();

          return (
            <div key={cIndex} className="group/company relative">
              {/* Company Level Two-Column Header */}
              <div className="flex justify-between items-baseline gap-4 leading-tight mb-0.5">
                <div className="min-w-0 flex-1">
                  <EditableField
                    value={company.company}
                    onSave={(val) => updateField(`work_experience[${cIndex}].company`, val)}
                    fieldPath={`work_experience[${cIndex}].company`}
                    as="h3"
                    className="font-bold text-[10.5pt] text-[#141413] break-words"
                    containerClassName="inline-block max-w-full"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <EditableField
                    value={company.dates}
                    onSave={(val) => updateField(`work_experience[${cIndex}].dates`, val)}
                    fieldPath={`work_experience[${cIndex}].dates`}
                    className="text-[9.5pt] font-normal text-right whitespace-nowrap text-[#44423D]"
                    containerClassName="w-auto inline-flex items-center justify-end"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${company.company || 'this experience'}?`)) {
                        removeWorkExperienceEntry(cIndex);
                      }
                    }}
                    className="opacity-0 group-hover/company:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-opacity no-print cursor-pointer"
                    title="Delete this company entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Roles Under Company */}
              {company.roles.map((role, rIndex) => {
                // If company name and role title are identical and it's the only role, omit the duplicate line
                const skipRoleHeader = hasIdenticalFirstRole && rIndex === 0;

                return (
                  <div key={rIndex} className="mb-1.5 last:mb-0">
                    {!skipRoleHeader && (
                      <div className="flex justify-between items-baseline gap-4 leading-tight mb-1">
                        <div className="min-w-0 flex-1 flex items-baseline gap-1.5">
                          <EditableField
                            value={role.title}
                            onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].title`, val)}
                            fieldPath={`work_experience[${cIndex}].roles[${rIndex}].title`}
                            className="italic font-normal text-[10pt] text-[#141413] break-words"
                            containerClassName="inline-block max-w-full"
                          />
                          {role.link && (
                            <a
                              href={role.link.startsWith('http') ? role.link : `https://${role.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9pt] text-[#0B57D0] hover:underline inline-flex items-center gap-0.5 ml-1 select-none font-sans"
                              title={role.link}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>[{getSemanticLinkLabel(role.link, 'Link')}]</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[9.5pt] italic font-normal text-[#44423D] shrink-0 text-right">
                          {role.location && (
                            <EditableField
                              value={role.location}
                              onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].location`, val)}
                              fieldPath={`work_experience[${cIndex}].roles[${rIndex}].location`}
                              className="w-auto whitespace-nowrap italic text-[9.5pt]"
                              containerClassName="w-auto inline-flex items-center"
                            />
                          )}
                          {role.dates && role.dates !== company.dates && (
                            <>
                              {role.location && <span className="not-italic select-none">|</span>}
                              <EditableField
                                value={role.dates}
                                onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].dates`, val)}
                                fieldPath={`work_experience[${cIndex}].roles[${rIndex}].dates`}
                                className="w-auto whitespace-nowrap italic text-[9.5pt]"
                                containerClassName="w-auto inline-flex items-center"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description Bullets */}
                    <div className="text-[9.75pt] leading-[1.32] text-[#141413]">
                      <EditableList
                        items={role.description}
                        basePath={`work_experience[${cIndex}].roles[${rIndex}].description`}
                        onUpdate={(i, val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].description[${i}]`, val)}
                        onAdd={(val) => addArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, val)}
                        onRemove={(i) => removeArrayItem(`work_experience[${cIndex}].roles[${rIndex}].description`, i)}
                        className="mb-1"
                      />
                      
                      {/* Key Results Sub-Block */}
                      {role.key_results && role.key_results.length > 0 && (
                        <div className="ml-5 mt-1 text-[9.25pt] text-[#2B2A27] leading-tight">
                          <span className="font-bold text-[#141413] mr-1">Key Results:</span>
                          <EditableField
                            value={role.key_results.join('; ')}
                            onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].key_results`, val.split(';').map(s => s.trim()).filter(Boolean))}
                            fieldPath={`work_experience[${cIndex}].roles[${rIndex}].key_results`}
                            className="inline text-[9.25pt]"
                          />
                        </div>
                      )}
                      
                      {/* Technologies Used Sub-Block */}
                      {role.technologies_used && role.technologies_used.length > 0 && (
                        <div className="ml-5 mt-1 text-[9.25pt] text-[#44423D] leading-tight">
                          <span className="font-bold text-[#141413] mr-1">Technologies/Skills Used:</span>
                          <EditableField
                            value={role.technologies_used.join(', ')}
                            onSave={(val) => updateField(`work_experience[${cIndex}].roles[${rIndex}].technologies_used`, val.split(',').map(s => s.trim()).filter(Boolean))}
                            fieldPath={`work_experience[${cIndex}].roles[${rIndex}].technologies_used`}
                            className="inline text-[9.25pt]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 mb-1 no-print">
        <button
          type="button"
          onClick={addWorkExperienceEntry}
          className="inline-flex items-center gap-1 text-xs text-[#0B57D0] hover:text-[#0842A0] font-sans py-1 px-1.5 hover:bg-blue-50 rounded transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Experience
        </button>
      </div>
    </section>
  );
}
