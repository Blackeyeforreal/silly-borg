'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { useResumeStore } from '@/store/resume-store';
import { Trash2, Plus } from 'lucide-react';
import type { ResumeData } from '@/lib/schema';

interface EducationSectionProps {
  data: NonNullable<ResumeData['education']>;
}

export function EducationSection({ data }: EducationSectionProps) {
  const { 
    updateField, 
    deleteBuiltinSection, 
    addEducationEntry, 
    removeEducationEntry 
  } = useResumeStore();

  return (
    <section className="mb-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[#141413] mb-2 mt-2 pb-0.5 group/header section-header">
        <h2 className="text-[10.5pt] font-bold uppercase tracking-[0.05em] text-[#141413]">
          Education
        </h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete the EDUCATION section? You can re-add it anytime.')) {
              deleteBuiltinSection('education');
            }
          }}
          className="opacity-0 group-hover/header:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded text-xs flex items-center gap-1 transition-opacity no-print cursor-pointer"
          title="Delete Education Section"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-sans">Delete Section</span>
        </button>
      </div>
      
      <div className="space-y-2">
        {data.map((edu, eIndex) => (
          <div key={eIndex} className="text-[9.75pt] leading-[1.32] text-[#141413] group/edu relative">
            {/* University & Graduation Date */}
            <div className="flex justify-between items-baseline gap-4 leading-tight mb-0.5">
              <div className="min-w-0 flex-1">
                <EditableField
                  value={edu.university}
                  onSave={(val) => updateField(`education[${eIndex}].university`, val)}
                  fieldPath={`education[${eIndex}].university`}
                  as="h3"
                  className="font-bold text-[10.5pt] text-[#141413] break-words"
                  containerClassName="inline-block max-w-full"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 text-right">
                <EditableField
                  value={edu.graduation_date}
                  onSave={(val) => updateField(`education[${eIndex}].graduation_date`, val)}
                  fieldPath={`education[${eIndex}].graduation_date`}
                  className="text-[9.5pt] font-normal text-right whitespace-nowrap text-[#44423D]"
                  containerClassName="w-auto inline-flex items-center justify-end"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${edu.university || 'this education entry'}?`)) {
                      removeEducationEntry(eIndex);
                    }
                  }}
                  className="opacity-0 group-hover/edu:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-0.5 rounded transition-opacity no-print cursor-pointer"
                  title="Delete this education entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Degree, Major & Location */}
            <div className="flex justify-between items-baseline gap-4 leading-tight mb-0.5">
              <div className="flex flex-wrap items-baseline gap-1 italic text-[10pt] text-[#141413] min-w-0 flex-1">
                <EditableField
                  value={edu.degree}
                  onSave={(val) => updateField(`education[${eIndex}].degree`, val)}
                  fieldPath={`education[${eIndex}].degree`}
                  className="w-auto inline text-[10pt] italic"
                />
                {edu.major && (
                  <>
                    <span className="select-none">, </span>
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
                  className="w-auto text-right whitespace-nowrap text-[9.5pt] italic font-normal text-[#44423D] shrink-0"
                  containerClassName="w-auto inline-flex items-center justify-end"
                />
              )}
            </div>

            {/* Honors & Awards */}
            {edu.honors_and_awards && edu.honors_and_awards.length > 0 && (
              <div className="ml-5 mt-0.5 text-[9.25pt] text-[#2B2A27] leading-tight">
                <span className="font-bold text-[#141413] mr-1">Honors & Awards:</span>
                <EditableField
                  value={edu.honors_and_awards.join(', ')}
                  onSave={(val) => updateField(`education[${eIndex}].honors_and_awards`, val.split(',').map(s => s.trim()).filter(Boolean))}
                  fieldPath={`education[${eIndex}].honors_and_awards`}
                  className="inline text-[9.25pt]"
                />
              </div>
            )}

            {/* Activities */}
            {edu.activities && edu.activities.length > 0 && (
              <div className="ml-5 mt-0.5 text-[9.25pt] text-[#44423D] leading-tight">
                <span className="font-bold text-[#141413] mr-1">Activities:</span>
                <EditableField
                  value={edu.activities.join(', ')}
                  onSave={(val) => updateField(`education[${eIndex}].activities`, val.split(',').map(s => s.trim()).filter(Boolean))}
                  fieldPath={`education[${eIndex}].activities`}
                  className="inline text-[9.25pt]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-1.5 mb-1 no-print">
        <button
          type="button"
          onClick={addEducationEntry}
          className="inline-flex items-center gap-1 text-xs text-[#0B57D0] hover:text-[#0842A0] font-sans py-1 px-1.5 hover:bg-blue-50 rounded transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Education
        </button>
      </div>
    </section>
  );
}
