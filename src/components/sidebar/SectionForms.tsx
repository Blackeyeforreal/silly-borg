'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderPlus,
  Sparkles,
  BookmarkCheck
} from 'lucide-react';
import { useResumeStore, getEffectiveSectionOrder } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';

interface SectionFormsProps {
  onOpenAddSectionModal?: () => void;
}

export function SectionForms({ onOpenAddSectionModal }: SectionFormsProps) {
  const { 
    resumeData, 
    updateField, 
    addArrayItem, 
    removeArrayItem, 
    addWorkExperienceEntry,
    removeWorkExperienceEntry,
    addEducationEntry,
    removeEducationEntry,
    addCustomSectionItem,
    removeCustomSectionItem,
    removeCustomSection,
    activeFormSection,
    setActiveFormSection,
    templateSettings
  } = useResumeStore();

  const { user, saveProfile, savedProfile, setAuthModalOpen } = useUserStore();
  const { addToast } = useToast();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal_info: true,
    work_experience: true,
    education: false,
    skills_and_interests: false,
  });

  // Sync when activeFormSection changes from external triggers
  useEffect(() => {
    if (activeFormSection) {
      setExpandedSections(prev => ({
        ...prev,
        [activeFormSection]: true
      }));
    }
  }, [activeFormSection]);

  if (!resumeData) return null;

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const currentOrder = getEffectiveSectionOrder(resumeData);
  const customSections = resumeData.custom_sections || [];

  return (
    <div className="space-y-4 text-xs text-[#141413] pb-10">
      {/* Save to Master Profile Banner */}
      <div className="flex items-center justify-between p-3 rounded-xs border border-[#E7E4DC] bg-[#F8F7F4] paper-shadow">
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-xs bg-white border border-[#DCD8CE] text-[#993322]">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413]">
              Master Record
            </div>
            {user ? (
              <p className="font-mono text-[10px] text-[#76736C]">
                {user.name}
                {savedProfile?.updatedAt && ` · Synced ${new Date(savedProfile.updatedAt).toLocaleDateString()}`}
              </p>
            ) : (
              <p className="font-mono text-[10px] text-[#76736C]">Log in to persist master profile</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else {
              saveProfile(resumeData, templateSettings);
              addToast('All resume sections & styling saved to profile', 'success');
            }
          }}
          className="px-2.5 py-1.5 bg-[#141413] hover:bg-[#2A2927] text-[#F8F7F4] rounded-xs font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer border border-[#141413] shrink-0"
        >
          {user ? 'Save Profile' : 'Sign In'}
        </button>
      </div>

      <div className="bg-[#F8F7F4] border-l-2 border-[#993322] p-3 text-[11px] text-[#76736C] font-mono leading-relaxed">
        <span className="text-[#993322] font-semibold">[ RECORDS ]</span> Modifications update the print-calibrated sheet beside this panel synchronously.
      </div>

      {/* 1. PERSONAL INFO SECTION */}
      <div className="border border-[#E7E4DC] rounded-xs overflow-hidden bg-white paper-shadow">
        <button
          type="button"
          onClick={() => toggleSection('personal_info')}
          className="w-full flex items-center justify-between p-3 bg-[#F8F7F4] hover:bg-[#EFECE6] transition-colors text-left cursor-pointer border-b border-[#E7E4DC]"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs uppercase">
              00
            </span>
            <div className="p-1 rounded-xs bg-white border border-[#E7E4DC] text-[#141413]">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs text-[#141413]">Personal Information</span>
          </div>
          {expandedSections['personal_info'] ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#76736C]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#76736C]" />
          )}
        </button>

        {expandedSections['personal_info'] && (
          <div className="p-4 space-y-3.5 bg-white">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={resumeData.personal_info.full_name || ''}
                onChange={(e) => updateField('personal_info.full_name', e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  value={resumeData.personal_info.contact.email || ''}
                  onChange={(e) => updateField('personal_info.contact.email', e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Phone</label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.phone || ''}
                  onChange={(e) => updateField('personal_info.contact.phone', e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Location</label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.location || ''}
                  onChange={(e) => updateField('personal_info.contact.location', e.target.value)}
                  placeholder="City, State / Remote"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                  Portfolio / Personal Website
                </label>
                <input
                  type="url"
                  value={resumeData.personal_info.contact.portfolio || ''}
                  onChange={(e) => updateField('personal_info.contact.portfolio', e.target.value)}
                  placeholder="https://janedoe.dev"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono text-[#993322]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={resumeData.personal_info.contact.linkedin || ''}
                  onChange={(e) => updateField('personal_info.contact.linkedin', e.target.value)}
                  placeholder="linkedin.com/in/jane"
                  className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={resumeData.personal_info.contact.github || ''}
                  onChange={(e) => updateField('personal_info.contact.github', e.target.value)}
                  placeholder="github.com/jane"
                  className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                  Other Handles / Links
                </label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.links || ''}
                  onChange={(e) => updateField('personal_info.contact.links', e.target.value)}
                  placeholder="x.com/jane"
                  className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RENDER FORMS ACCORDING TO CURRENT SECTION ORDER */}
      {currentOrder.map((sectionId) => {
        // WORK EXPERIENCE FORM
        if (sectionId === 'work_experience' && resumeData.work_experience) {
          const isExpanded = expandedSections['work_experience'] ?? false;
          return (
            <div key="work_experience" className="border border-[#E7E4DC] rounded-xs overflow-hidden bg-white paper-shadow">
              <button
                type="button"
                onClick={() => toggleSection('work_experience')}
                className="w-full flex items-center justify-between p-3 bg-[#F8F7F4] hover:bg-[#EFECE6] transition-colors text-left cursor-pointer border-b border-[#E7E4DC]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs uppercase">
                    01
                  </span>
                  <div className="p-1 rounded-xs bg-white border border-[#E7E4DC] text-[#141413]">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-[#141413]">Work Experience</span>
                  <span className="font-mono text-[10px] text-[#76736C]">
                    [{resumeData.work_experience.length} records]
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#76736C]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#76736C]" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                  {resumeData.work_experience.map((company, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="p-3 rounded-xs border border-[#E7E4DC] bg-[#FAF9F6] space-y-3 relative group/company"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#E7E4DC]">
                        <span className="font-mono text-[11px] font-bold text-[#141413] uppercase tracking-wider">
                          Company Record #{String(cIdx + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${company.company || 'this company'}?`)) {
                              removeWorkExperienceEntry(cIdx);
                            }
                          }}
                          className="text-[#76736C] hover:text-[#993322] p-1 rounded-xs hover:bg-[#FBF3F1] transition-colors cursor-pointer"
                          title="Remove Company"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Company Name</label>
                          <input
                            type="text"
                            value={company.company}
                            onChange={(e) => updateField(`work_experience[${cIdx}].company`, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Dates</label>
                          <input
                            type="text"
                            value={company.dates}
                            onChange={(e) => updateField(`work_experience[${cIdx}].dates`, e.target.value)}
                            placeholder="e.g. 2021 – Present"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="space-y-3 pt-1">
                        {company.roles.map((role, rIdx) => (
                          <div key={rIdx} className="pl-3 border-l-2 border-[#993322] space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Job Title</label>
                                <input
                                  type="text"
                                  value={role.title}
                                  onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].title`, e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                                />
                              </div>
                              <div>
                                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Location</label>
                                <input
                                  type="text"
                                  value={role.location}
                                  onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].location`, e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Project / Role URL</label>
                              <input
                                type="url"
                                value={role.link || ''}
                                onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].link`, e.target.value)}
                                placeholder="https://company.com/product"
                                className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#993322] bg-white font-mono"
                              />
                            </div>

                            {/* Bullet Points */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C]">
                                  Impact Bullets ({role.description?.length || 0})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addArrayItem(`work_experience[${cIdx}].roles[${rIdx}].description`, 'Accomplished measurable result using modern engineering architectures.')}
                                  className="font-mono text-[10px] uppercase tracking-wider text-[#993322] hover:text-[#802B1D] flex items-center gap-0.5 font-semibold cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> Add Bullet
                                </button>
                              </div>

                              <div className="space-y-1.5">
                                {role.description.map((bullet, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-1.5">
                                    <textarea
                                      rows={2}
                                      value={bullet}
                                      onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].description[${bIdx}]`, e.target.value)}
                                      className="flex-1 px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden leading-relaxed text-[#141413] bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeArrayItem(`work_experience[${cIdx}].roles[${rIdx}].description`, bIdx)}
                                      className="p-1 text-[#76736C] hover:text-[#993322] rounded-xs cursor-pointer"
                                      title="Remove bullet"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Key Results */}
                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">
                                Key Results (semicolon separated)
                              </label>
                              <input
                                type="text"
                                value={role.key_results?.join('; ') || ''}
                                onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].key_results`, e.target.value.split(';').map(s => s.trim()))}
                                placeholder="Increased speed by 40%; Saved $20k"
                                className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                              />
                            </div>

                            {/* Technologies Used */}
                            <div>
                              <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">
                                Technologies Used (comma separated)
                              </label>
                              <input
                                type="text"
                                value={role.technologies_used?.join(', ') || ''}
                                onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].technologies_used`, e.target.value.split(',').map(s => s.trim()))}
                                placeholder="TypeScript, React, PostgreSQL, Docker"
                                className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addWorkExperienceEntry}
                    className="w-full py-2 border border-dashed border-[#DCD8CE] hover:border-[#141413] text-[#141413] bg-white hover:bg-[#F8F7F4] rounded-xs font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#993322]" /> Add Company Record
                  </button>
                </div>
              )}
            </div>
          );
        }

        // EDUCATION FORM
        if (sectionId === 'education' && resumeData.education) {
          const isExpanded = expandedSections['education'] ?? false;
          return (
            <div key="education" className="border border-[#E7E4DC] rounded-xs overflow-hidden bg-white paper-shadow">
              <button
                type="button"
                onClick={() => toggleSection('education')}
                className="w-full flex items-center justify-between p-3 bg-[#F8F7F4] hover:bg-[#EFECE6] transition-colors text-left cursor-pointer border-b border-[#E7E4DC]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs uppercase">
                    02
                  </span>
                  <div className="p-1 rounded-xs bg-white border border-[#E7E4DC] text-[#141413]">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-[#141413]">Education</span>
                  <span className="font-mono text-[10px] text-[#76736C]">
                    [{resumeData.education.length} records]
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#76736C]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#76736C]" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                  {resumeData.education.map((edu, eIdx) => (
                    <div 
                      key={eIdx} 
                      className="p-3 rounded-xs border border-[#E7E4DC] bg-[#FAF9F6] space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#E7E4DC]">
                        <span className="font-mono text-[11px] font-bold text-[#141413] uppercase tracking-wider">
                          Education Record #{String(eIdx + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${edu.university || 'this education'}?`)) {
                              removeEducationEntry(eIdx);
                            }
                          }}
                          className="text-[#76736C] hover:text-[#993322] p-1 rounded-xs hover:bg-[#FBF3F1] transition-colors cursor-pointer"
                          title="Remove Education Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">University / College</label>
                          <input
                            type="text"
                            value={edu.university}
                            onChange={(e) => updateField(`education[${eIdx}].university`, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Graduation Date</label>
                          <input
                            type="text"
                            value={edu.graduation_date}
                            onChange={(e) => updateField(`education[${eIdx}].graduation_date`, e.target.value)}
                            placeholder="e.g. May 2023"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateField(`education[${eIdx}].degree`, e.target.value)}
                            placeholder="Bachelor of Science"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Major</label>
                          <input
                            type="text"
                            value={edu.major}
                            onChange={(e) => updateField(`education[${eIdx}].major`, e.target.value)}
                            placeholder="Computer Science"
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateField(`education[${eIdx}].location`, e.target.value)}
                          placeholder="City, State"
                          className="w-full px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5 font-medium">
                          Honors &amp; Awards (comma separated)
                        </label>
                        <input
                          type="text"
                          value={edu.honors_and_awards?.join(', ') || ''}
                          onChange={(e) => updateField(`education[${eIdx}].honors_and_awards`, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="Dean's List, Summa Cum Laude"
                          className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5 font-medium">
                          Activities (comma separated)
                        </label>
                        <input
                          type="text"
                          value={edu.activities?.join(', ') || ''}
                          onChange={(e) => updateField(`education[${eIdx}].activities`, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="ACM Student Chapter, Hackathon Lead"
                          className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEducationEntry}
                    className="w-full py-2 border border-dashed border-[#DCD8CE] hover:border-[#141413] text-[#141413] bg-white hover:bg-[#F8F7F4] rounded-xs font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#993322]" /> Add Education Record
                  </button>
                </div>
              )}
            </div>
          );
        }

        // SKILLS & INTERESTS FORM
        if (sectionId === 'skills_and_interests' && resumeData.skills_and_interests) {
          const isExpanded = expandedSections['skills_and_interests'] ?? false;
          const skills = resumeData.skills_and_interests;
          return (
            <div key="skills_and_interests" className="border border-[#E7E4DC] rounded-xs overflow-hidden bg-white paper-shadow">
              <button
                type="button"
                onClick={() => toggleSection('skills_and_interests')}
                className="w-full flex items-center justify-between p-3 bg-[#F8F7F4] hover:bg-[#EFECE6] transition-colors text-left cursor-pointer border-b border-[#E7E4DC]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs uppercase">
                    03
                  </span>
                  <div className="p-1 rounded-xs bg-white border border-[#E7E4DC] text-[#141413]">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-[#141413]">Certifications, Skills &amp; Interests</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#76736C]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#76736C]" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-3.5 bg-white">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                      Technologies (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.technologies?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.technologies', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="React, Next.js, TypeScript, Node.js, Python, PostgreSQL"
                      className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                      Skills &amp; Methodologies (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.skills?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.skills', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Full-Stack Development, System Architecture, CI/CD, Agile"
                      className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                      Certifications (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.certifications?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.certifications', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="AWS Certified Solutions Architect, Google Cloud Professional"
                      className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                      Interests (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.interests?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.interests', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Open Source, Distributed Systems, Chess"
                      className="w-full px-3 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }

        // CUSTOM SECTION FORM
        const customSec = customSections.find(c => c.id === sectionId);
        if (customSec) {
          const secIdx = customSections.findIndex(c => c.id === sectionId);
          const isExpanded = expandedSections[sectionId] ?? false;
          const basePath = `custom_sections[${secIdx}]`;

          return (
            <div key={sectionId} className="border border-[#E7E4DC] rounded-xs overflow-hidden bg-white paper-shadow">
              <button
                type="button"
                onClick={() => toggleSection(sectionId)}
                className="w-full flex items-center justify-between p-3 bg-[#F8F7F4] hover:bg-[#EFECE6] transition-colors text-left cursor-pointer border-b border-[#E7E4DC]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs uppercase">
                    +
                  </span>
                  <div className="p-1 rounded-xs bg-white border border-[#E7E4DC] text-[#141413]">
                    <FolderPlus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-[#141413]">{customSec.section_title || 'Custom Section'}</span>
                  <span className="font-mono text-[10px] text-[#76736C]">
                    [{customSec.items?.length || 0} records]
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#76736C]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#76736C]" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Section Title</label>
                      <input
                        type="text"
                        value={customSec.section_title}
                        onChange={(e) => updateField(`${basePath}.section_title`, e.target.value.toUpperCase())}
                        placeholder="e.g. FEATURED PROJECTS"
                        className="w-full px-2.5 py-1 text-xs uppercase font-mono font-bold border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete section "${customSec.section_title}"?`)) {
                          removeCustomSection(customSec.id);
                        }
                      }}
                      className="mt-5 p-1.5 text-[#76736C] hover:text-[#993322] rounded-xs hover:bg-[#FBF3F1] transition-colors cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {customSec.items.map((item, itemIdx) => {
                    const itemPath = `${basePath}.items[${itemIdx}]`;
                    return (
                      <div key={itemIdx} className="p-3 rounded-xs border border-[#E7E4DC] bg-[#FAF9F6] space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#E7E4DC]">
                          <span className="font-mono text-[11px] font-bold text-[#141413] uppercase tracking-wider">
                            Record #{String(itemIdx + 1).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomSectionItem(customSec.id, itemIdx)}
                            className="p-1 text-[#76736C] hover:text-[#993322] rounded-xs cursor-pointer"
                            title="Remove Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Title / Project Name</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateField(`${itemPath}.title`, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Dates</label>
                            <input
                              type="text"
                              value={item.dates || ''}
                              onChange={(e) => updateField(`${itemPath}.dates`, e.target.value)}
                              placeholder="2023 – 2024"
                              className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Subtitle / Stack</label>
                            <input
                              type="text"
                              value={item.subtitle || ''}
                              onChange={(e) => updateField(`${itemPath}.subtitle`, e.target.value)}
                              placeholder="Next.js, Tailwind, TypeScript"
                              className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Project URL</label>
                            <input
                              type="url"
                              value={item.link || ''}
                              onChange={(e) => updateField(`${itemPath}.link`, e.target.value)}
                              placeholder="https://demo.app"
                              className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden font-mono text-[#993322] bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-0.5">Location</label>
                            <input
                              type="text"
                              value={item.location || ''}
                              onChange={(e) => updateField(`${itemPath}.location`, e.target.value)}
                              placeholder="San Francisco, CA"
                              className="w-full px-2 py-1 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C]">
                              Impact Bullets ({item.description?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => addArrayItem(`${itemPath}.description`, 'Delivered high-impact capability with measurable success.')}
                              className="font-mono text-[10px] uppercase tracking-wider text-[#993322] hover:text-[#802B1D] flex items-center gap-0.5 font-semibold cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Bullet
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {item.description.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-1.5">
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={(e) => updateField(`${itemPath}.description[${bIdx}]`, e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white leading-relaxed"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(`${itemPath}.description`, bIdx)}
                                  className="p-1 text-[#76736C] hover:text-[#993322] rounded-xs cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => addCustomSectionItem(customSec.id)}
                    className="w-full py-2 border border-dashed border-[#DCD8CE] hover:border-[#141413] text-[#141413] bg-white hover:bg-[#F8F7F4] rounded-xs font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#993322]" /> Add Entry to {customSec.section_title}
                  </button>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}

      {/* Button to Add New Custom Section */}
      {onOpenAddSectionModal && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onOpenAddSectionModal}
            className="w-full py-2.5 border border-dashed border-[#DCD8CE] hover:border-[#141413] text-[#141413] bg-white hover:bg-[#F8F7F4] rounded-xs font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer paper-shadow"
          >
            <Plus className="w-4 h-4 text-[#993322]" /> Add Custom Section (Projects, Honors, Certifications)
          </button>
        </div>
      )}
    </div>
  );
}
