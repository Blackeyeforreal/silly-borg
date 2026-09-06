'use client';

import React from 'react';
import { Trash2, Plus, ExternalLink } from 'lucide-react';
import { EditableField } from './EditableField';
import { EditableList } from './EditableList';
import { useResumeStore } from '@/store/resume-store';
import type { CustomSection } from '@/lib/schema';
import { getSemanticLinkLabel } from '@/lib/normalization/resume-normalizer';

interface CustomSectionViewProps {
  section: CustomSection;
  sectionIndex: number;
}

export function CustomSectionView({ section, sectionIndex }: CustomSectionViewProps) {
  const {
    updateField,
    addArrayItem,
    removeArrayItem,
    removeCustomSection,
    addCustomSectionItem,
    removeCustomSectionItem
  } = useResumeStore();

  const basePath = `custom_sections[${sectionIndex}]`;

  return (
    <section className="mb-2.5 group/section">
      {/* Section Header with Delete Button */}
      <div className="flex items-center justify-between border-b border-[#141413] mb-2 mt-2 pb-0.5 section-header">
        <EditableField
          value={section.section_title}
          onSave={(val) => updateField(`${basePath}.section_title`, val.toUpperCase())}
          fieldPath={`${basePath}.section_title`}
          as="h2"
          className="text-[10.5pt] font-bold uppercase tracking-[0.05em] text-[#141413]"
          containerClassName="flex-1"
        />
        <button
          onClick={() => {
            if (window.confirm(`Delete the "${section.section_title}" section?`)) {
              removeCustomSection(section.id);
            }
          }}
          className="opacity-0 group-hover/section:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all no-print cursor-pointer"
          title="Delete this section"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Section Items */}
      <div className="space-y-2">
        {section.items.map((item, itemIndex) => {
          const itemPath = `${basePath}.items[${itemIndex}]`;

          return (
            <div key={itemIndex} className="group/item relative text-[9.75pt] leading-[1.32] text-[#141413]">
              {/* Item Title & Dates */}
              <div className="flex justify-between items-baseline gap-4 leading-tight mb-0.5">
                <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                  <EditableField
                    value={item.title}
                    onSave={(val) => updateField(`${itemPath}.title`, val)}
                    fieldPath={`${itemPath}.title`}
                    as="h3"
                    className="font-bold text-[10.5pt] text-[#141413] break-words"
                    containerClassName="inline-block max-w-full"
                  />
                  {item.link && (
                    <a
                      href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0B57D0] hover:underline text-[9pt] font-normal inline-flex items-center gap-0.5 shrink-0 ml-1 font-sans"
                      title={item.link}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>[{getSemanticLinkLabel(item.link, 'Demo')}]</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-70 no-print" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <EditableField
                    value={item.dates || ''}
                    onSave={(val) => updateField(`${itemPath}.dates`, val)}
                    fieldPath={`${itemPath}.dates`}
                    className="text-[9.5pt] font-normal text-right whitespace-nowrap text-[#44423D]"
                    containerClassName="w-auto inline-flex items-center justify-end"
                  />
                  <button
                    onClick={() => removeCustomSectionItem(section.id, itemIndex)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded no-print transition-opacity cursor-pointer"
                    title="Remove this entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Subtitle & Location */}
              {(item.subtitle || item.location) && (
                <div className="flex justify-between items-baseline gap-4 leading-tight mb-1">
                  <EditableField
                    value={item.subtitle || ''}
                    onSave={(val) => updateField(`${itemPath}.subtitle`, val)}
                    fieldPath={`${itemPath}.subtitle`}
                    className="italic font-normal text-[10pt] text-[#44423D] break-words"
                    containerClassName="flex-1 min-w-0"
                  />
                  {item.location && (
                    <EditableField
                      value={item.location}
                      onSave={(val) => updateField(`${itemPath}.location`, val)}
                      fieldPath={`${itemPath}.location`}
                      className="w-auto whitespace-nowrap text-[9.5pt] italic font-normal text-[#44423D] shrink-0 text-right"
                      containerClassName="w-auto inline-flex items-center"
                    />
                  )}
                </div>
              )}

              {/* Description Bullets */}
              <div className="text-[9.75pt] leading-[1.32] text-[#141413]">
                <EditableList
                  items={item.description}
                  basePath={`${itemPath}.description`}
                  onUpdate={(i, val) => updateField(`${itemPath}.description[${i}]`, val)}
                  onAdd={(val) => addArrayItem(`${itemPath}.description`, val)}
                  onRemove={(i) => removeArrayItem(`${itemPath}.description`, i)}
                  className="mb-0.5"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Button */}
      <div className="mt-1.5 no-print">
        <button
          onClick={() => addCustomSectionItem(section.id)}
          className="inline-flex items-center gap-1 text-xs text-[#0B57D0] hover:text-[#0842A0] hover:bg-blue-50 px-2 py-0.5 rounded transition-colors font-sans cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Entry to {section.section_title}
        </button>
      </div>
    </section>
  );
}
