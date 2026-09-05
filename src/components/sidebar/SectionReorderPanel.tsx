'use client';

import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Plus, 
  GripVertical, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderPlus, 
  RotateCcw,
  Sparkles,
  Edit3
} from 'lucide-react';
import { useResumeStore, getEffectiveSectionOrder } from '@/store/resume-store';

interface SectionReorderPanelProps {
  onOpenAddSectionModal?: () => void;
}

export function SectionReorderPanel({ onOpenAddSectionModal }: SectionReorderPanelProps) {
  const { 
    resumeData, 
    moveSection, 
    deleteBuiltinSection, 
    restoreBuiltinSection, 
    removeCustomSection,
    setSidebarTab,
    setActiveFormSection
  } = useResumeStore();

  if (!resumeData) return null;

  const currentOrder = getEffectiveSectionOrder(resumeData);

  // Determine which sections are available
  const hasWorkExp = resumeData.work_experience && resumeData.work_experience.length > 0;
  const hasEdu = resumeData.education && resumeData.education.length > 0;
  const hasSkills = !!resumeData.skills_and_interests;
  const customSections = resumeData.custom_sections || [];

  // Deleted built-in sections that can be restored
  const deletedBuiltins: ('work_experience' | 'education' | 'skills_and_interests')[] = [];
  if (!hasWorkExp) deletedBuiltins.push('work_experience');
  if (!hasEdu) deletedBuiltins.push('education');
  if (!hasSkills) deletedBuiltins.push('skills_and_interests');

  const getSectionMetadata = (id: string) => {
    if (id === 'work_experience') {
      return {
        title: 'Work Experience',
        icon: Briefcase,
        count: `${resumeData.work_experience?.length || 0} entries`,
        isBuiltin: true,
        deleteAction: () => {
          if (window.confirm('Delete Work Experience section? You can restore it anytime.')) {
            deleteBuiltinSection('work_experience');
          }
        }
      };
    }
    if (id === 'education') {
      return {
        title: 'Education',
        icon: GraduationCap,
        count: `${resumeData.education?.length || 0} entries`,
        isBuiltin: true,
        deleteAction: () => {
          if (window.confirm('Delete Education section? You can restore it anytime.')) {
            deleteBuiltinSection('education');
          }
        }
      };
    }
    if (id === 'skills_and_interests') {
      const s = resumeData.skills_and_interests;
      const count = [
        s?.technologies?.length ? 'tech' : '',
        s?.skills?.length ? 'skills' : '',
        s?.certifications?.length ? 'certs' : ''
      ].filter(Boolean).length;
      return {
        title: 'Certifications, Skills & Interests',
        icon: Wrench,
        count: `${count} categories`,
        isBuiltin: true,
        deleteAction: () => {
          if (window.confirm('Delete Skills & Interests section? You can restore it anytime.')) {
            deleteBuiltinSection('skills_and_interests');
          }
        }
      };
    }
    
    // Custom section
    const customSec = customSections.find(c => c.id === id);
    return {
      title: customSec?.section_title || 'Custom Section',
      icon: FolderPlus,
      count: `${customSec?.items?.length || 0} items`,
      isBuiltin: false,
      deleteAction: () => {
        if (window.confirm(`Delete section "${customSec?.section_title || 'Custom'}"?`)) {
          removeCustomSection(id);
        }
      }
    };
  };

  const handleEditSection = (sectionId: string) => {
    setActiveFormSection(sectionId);
    setSidebarTab('forms');
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Explanation Banner */}
      <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-3 text-xs text-blue-900 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          Rearrange the order of sections on your resume. The order here immediately updates the live resume preview, and will be preserved in your exported DOCX and PDF.
        </p>
      </div>

      {/* Pinned Personal Info */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
          Header (Always Top)
        </label>
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-gray-700">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
              ★
            </span>
            <div>
              <div className="font-semibold text-gray-900">Personal Info &amp; Contact</div>
              <div className="text-[11px] text-gray-500">{resumeData.personal_info.full_name || 'Your Name'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleEditSection('personal_info')}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Reorderable Section List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            Resume Sections ({currentOrder.length})
          </label>
          {onOpenAddSectionModal && (
            <button
              type="button"
              onClick={onOpenAddSectionModal}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          )}
        </div>

        {currentOrder.length === 0 ? (
          <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-xs">
            No sections currently active. Add or restore sections below.
          </div>
        ) : (
          <div className="space-y-2">
            {currentOrder.map((sectionId, index) => {
              const meta = getSectionMetadata(sectionId);
              const Icon = meta.icon;
              const isFirst = index === 0;
              const isLast = index === currentOrder.length - 1;

              return (
                <div
                  key={sectionId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 text-center text-xs font-mono font-bold text-gray-400">
                      {index + 1}
                    </span>
                    <div className="p-1.5 rounded-md bg-gray-100 text-gray-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate text-xs sm:text-sm">
                        {meta.title}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {meta.count}
                      </div>
                    </div>
                  </div>

                  {/* Move Up / Down and Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleEditSection(sectionId)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit section in form"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'up')}
                      disabled={isFirst}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors cursor-pointer"
                      title="Move Section Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'down')}
                      disabled={isLast}
                      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors cursor-pointer"
                      title="Move Section Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={meta.deleteAction}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer ml-0.5"
                      title="Delete this section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restore Deleted Built-in Sections */}
      {deletedBuiltins.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Restore Removed Sections
          </label>
          <div className="space-y-1.5">
            {deletedBuiltins.map((key) => {
              const label = key === 'work_experience' 
                ? 'Work Experience' 
                : key === 'education' 
                ? 'Education' 
                : 'Skills & Interests';

              return (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-xs"
                >
                  <span className="text-gray-600 font-medium">{label}</span>
                  <button
                    type="button"
                    onClick={() => restoreBuiltinSection(key)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Restore
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
