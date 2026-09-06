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
    <div className="space-y-5 text-xs text-[#141413]">
      {/* Editorial Note */}
      <div className="bg-[#F8F7F4] border-l-2 border-[#993322] p-3 text-[11px] text-[#76736C] font-mono leading-relaxed">
        <span className="text-[#993322] font-semibold">[ STRUCTURE ]</span> Reorder document sections. The hierarchy defined here translates directly to live canvas, PDF, and DOCX.
      </div>

      {/* Pinned Personal Info */}
      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#76736C] mb-2">
          Header (Fixed · Top)
        </label>
        <div className="flex items-center justify-between p-3 rounded-xs border border-[#E7E4DC] bg-[#F8F7F4]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs">
              00
            </span>
            <div>
              <div className="font-semibold text-[#141413] text-xs">Personal Info &amp; Contact</div>
              <div className="font-mono text-[11px] text-[#76736C]">{resumeData.personal_info.full_name || 'Candidate Name'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleEditSection('personal_info')}
            className="font-mono text-[11px] text-[#141413] hover:text-[#993322] uppercase tracking-wider flex items-center gap-1 font-semibold px-2 py-1 rounded-xs border border-[#DCD8CE] hover:border-[#141413] bg-white transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>

      {/* Reorderable Section List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413]">
            Document Sections ({currentOrder.length})
          </label>
          {onOpenAddSectionModal && (
            <button
              type="button"
              onClick={onOpenAddSectionModal}
              className="font-mono text-[11px] uppercase tracking-wider text-[#993322] hover:text-[#802B1D] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          )}
        </div>

        {currentOrder.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-[#DCD8CE] rounded-xs text-[#76736C] font-mono text-xs">
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
                  className="flex items-center justify-between p-2.5 rounded-xs border border-[#E7E4DC] bg-white hover:border-[#141413] transition-all group paper-shadow"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-6 font-mono text-xs font-bold text-[#76736C]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="p-1.5 rounded-xs bg-[#F8F7F4] border border-[#E7E4DC] text-[#141413]">
                      <Icon className="w-3.5 h-3.5 text-[#993322]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#141413] truncate text-xs">
                        {meta.title}
                      </div>
                      <div className="font-mono text-[10px] text-[#76736C]">
                        {meta.count}
                      </div>
                    </div>
                  </div>

                  {/* Move Up / Down and Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleEditSection(sectionId)}
                      className="p-1 text-[#76736C] hover:text-[#141413] hover:bg-[#F3F1EC] rounded-xs transition-colors cursor-pointer"
                      title="Edit section in records"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'up')}
                      disabled={isFirst}
                      className="p-1 text-[#76736C] hover:text-[#141413] hover:bg-[#F3F1EC] rounded-xs disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move Section Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveSection(sectionId, 'down')}
                      disabled={isLast}
                      className="p-1 text-[#76736C] hover:text-[#141413] hover:bg-[#F3F1EC] rounded-xs disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move Section Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={meta.deleteAction}
                      className="p-1 text-[#76736C] hover:text-[#993322] hover:bg-[#FBF3F1] rounded-xs transition-colors cursor-pointer ml-0.5"
                      title="Delete this section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="pt-2 border-t border-[#E7E4DC]">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#76736C] mb-2">
            Archived Sections
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
                  className="flex items-center justify-between p-2 rounded-xs border border-dashed border-[#DCD8CE] bg-[#F8F7F4] text-xs"
                >
                  <span className="text-[#141413] font-medium">{label}</span>
                  <button
                    type="button"
                    onClick={() => restoreBuiltinSection(key)}
                    className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-[#993322] hover:text-[#802B1D] font-semibold px-2 py-0.5 rounded-xs transition-colors cursor-pointer"
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
