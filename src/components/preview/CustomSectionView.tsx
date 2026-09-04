'use client';

import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { EditableField } from './EditableField';
import { EditableList } from './EditableList';
import { useResumeStore } from '@/store/resume-store';
import type { CustomSection } from '@/lib/schema';

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
    <div className="mb-2 group/section">
      {/* Section Header with Delete Button */}
      <div className="flex items-center justify-between border-b border-black mb-1.5 mt-2.5 pb-0.5">
        <EditableField
          value={section.section_title}
          onSave={(val) => updateField(`${basePath}.section_title`, val.toUpperCase())}
          fieldPath={`${basePath}.section_title`}
          as="h2"
          className="text-[12pt] font-bold uppercase tracking-normal text-black"
          containerClassName="flex-1"
        />
        <button
          onClick={() => {
            if (window.confirm(`Delete the "${section.section_title}" section?`)) {
              removeCustomSection(section.id);
            }
          }}
          className="opacity-0 group-hover/section:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-all no-print"
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
            <div key={itemIndex} className="group/item relative text-[10pt] leading-[1.25] text-black">
              {/* Item Title & Dates */}
              <div className="flex justify-between items-baseline leading-tight">
                <EditableField
                  value={item.title}
                  onSave={(val) => updateField(`${itemPath}.title`, val)}
                  fieldPath={`${itemPath}.title`}
                  as="h3"
                  className="font-bold text-[10.5pt] text-black"
                  containerClassName="flex-1 min-w-0"
                />
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <EditableField
                    value={item.dates || ''}
                    onSave={(val) => updateField(`${itemPath}.dates`, val)}
                    fieldPath={`${itemPath}.dates`}
                    className="text-[10pt] font-normal text-right whitespace-nowrap text-black"
                    containerClassName="w-auto inline-flex items-center justify-end"
                  />
                  <button
                    onClick={() => removeCustomSectionItem(section.id, itemIndex)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded no-print transition-opacity"
                    title="Remove this entry"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Subtitle & Location */}
              {(item.subtitle || item.location) && (
                <div className="flex justify-between items-baseline leading-tight mb-0.5">
                  <EditableField
                    value={item.subtitle || ''}
                    onSave={(val) => updateField(`${itemPath}.subtitle`, val)}
                    fieldPath={`${itemPath}.subtitle`}
                    className="italic font-normal text-[10pt] text-black"
                    containerClassName="flex-1 min-w-0"
                  />
                  {item.location && (
                    <EditableField
                      value={item.location}
                      onSave={(val) => updateField(`${itemPath}.location`, val)}
                      fieldPath={`${itemPath}.location`}
                      className="w-auto whitespace-nowrap text-[10pt] italic font-normal text-black ml-4 shrink-0"
                      containerClassName="w-auto inline-flex items-center"
                    />
                  )}
                </div>
              )}

              {/* Description Bullets */}
              <div className="text-[10pt] leading-[1.25] text-black">
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
      <div className="mt-1 no-print">
        <button
          onClick={() => addCustomSectionItem(section.id)}
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Entry to {section.section_title}
        </button>
      </div>
    </div>
  );
}
