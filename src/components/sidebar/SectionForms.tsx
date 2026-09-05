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
    <div className="space-y-4 text-sm pb-10">
      {/* Save to Master Profile Banner */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-100 text-emerald-700">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-emerald-950">Master Profile</div>
            {user ? (
              <p className="text-[11px] text-emerald-800">
                Logged in as {user.name}
                {savedProfile?.updatedAt && ` (Saved ${new Date(savedProfile.updatedAt).toLocaleDateString()})`}
              </p>
            ) : (
              <p className="text-[11px] text-emerald-800">Log in to save all sections to your account</p>
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
              addToast('All resume sections & styling saved to your profile!', 'success');
            }
          }}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          {user ? 'Save to Profile' : 'Log In & Save'}
        </button>
      </div>

      <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          Fill out or update your details here. Every keystroke updates your live resume preview side-by-side immediately.
        </p>
      </div>

      {/* 1. PERSONAL INFO SECTION */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('personal_info')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1 rounded bg-blue-100 text-blue-700">
              <User className="w-4 h-4" />
            </div>
            <span>Personal Information</span>
          </div>
          {expandedSections['personal_info'] ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {expandedSections['personal_info'] && (
          <div className="p-4 space-y-3.5 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={resumeData.personal_info.full_name || ''}
                onChange={(e) => updateField('personal_info.full_name', e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={resumeData.personal_info.contact.email || ''}
                  onChange={(e) => updateField('personal_info.contact.email', e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.phone || ''}
                  onChange={(e) => updateField('personal_info.contact.phone', e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.location || ''}
                  onChange={(e) => updateField('personal_info.contact.location', e.target.value)}
                  placeholder="City, State / Remote"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Links (Portfolio / LinkedIn)
                </label>
                <input
                  type="text"
                  value={resumeData.personal_info.contact.links || ''}
                  onChange={(e) => updateField('personal_info.contact.links', e.target.value)}
                  placeholder="linkedin.com/in/jane | github.com/jane"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
            <div key="work_experience" className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('work_experience')}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
                  <div className="p-1 rounded bg-indigo-100 text-indigo-700">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span>Work Experience</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    ({resumeData.work_experience.length} companies)
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-5 border-t border-gray-100">
                  {resumeData.work_experience.map((company, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-3 relative group/company"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Company #{cIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${company.company || 'this company'}?`)) {
                              removeWorkExperienceEntry(cIdx);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Company"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Company Name</label>
                          <input
                            type="text"
                            value={company.company}
                            onChange={(e) => updateField(`work_experience[${cIdx}].company`, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Dates</label>
                          <input
                            type="text"
                            value={company.dates}
                            onChange={(e) => updateField(`work_experience[${cIdx}].dates`, e.target.value)}
                            placeholder="e.g. 2021 – Present"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="space-y-3 pt-1">
                        {company.roles.map((role, rIdx) => (
                          <div key={rIdx} className="pl-3 border-l-2 border-indigo-200 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500">Job Title</label>
                                <input
                                  type="text"
                                  value={role.title}
                                  onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].title`, e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500">Location</label>
                                <input
                                  type="text"
                                  value={role.location}
                                  onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].location`, e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            </div>

                            {/* Bullet Points */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-[10px] font-semibold text-gray-500">
                                  Bullet Points ({role.description?.length || 0})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => addArrayItem(`work_experience[${cIdx}].roles[${rIdx}].description`, 'Accomplished measurable result using modern technologies.')}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-medium cursor-pointer"
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
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none leading-snug"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeArrayItem(`work_experience[${cIdx}].roles[${rIdx}].description`, bIdx)}
                                      className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
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
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                                Key Results (semicolon separated)
                              </label>
                              <input
                                type="text"
                                value={role.key_results?.join('; ') || ''}
                                onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].key_results`, e.target.value.split(';').map(s => s.trim()))}
                                placeholder="Increased speed by 40%; Saved $20k"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>

                            {/* Technologies Used */}
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                                Technologies Used (comma separated)
                              </label>
                              <input
                                type="text"
                                value={role.technologies_used?.join(', ') || ''}
                                onChange={(e) => updateField(`work_experience[${cIdx}].roles[${rIdx}].technologies_used`, e.target.value.split(',').map(s => s.trim()))}
                                placeholder="TypeScript, React, PostgreSQL, Docker"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full py-2 border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Company Experience
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
            <div key="education" className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('education')}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
                  <div className="p-1 rounded bg-green-100 text-green-700">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span>Education</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    ({resumeData.education.length} entries)
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  {resumeData.education.map((edu, eIdx) => (
                    <div 
                      key={eIdx} 
                      className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-gray-200">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Education #{eIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${edu.university || 'this education'}?`)) {
                              removeEducationEntry(eIdx);
                            }
                          }}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove Education Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">University / College</label>
                          <input
                            type="text"
                            value={edu.university}
                            onChange={(e) => updateField(`education[${eIdx}].university`, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Graduation Date</label>
                          <input
                            type="text"
                            value={edu.graduation_date}
                            onChange={(e) => updateField(`education[${eIdx}].graduation_date`, e.target.value)}
                            placeholder="e.g. May 2023"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateField(`education[${eIdx}].degree`, e.target.value)}
                            placeholder="Bachelor of Science"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Major</label>
                          <input
                            type="text"
                            value={edu.major}
                            onChange={(e) => updateField(`education[${eIdx}].major`, e.target.value)}
                            placeholder="Computer Science"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateField(`education[${eIdx}].location`, e.target.value)}
                          placeholder="City, State"
                          className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          Honors &amp; Awards (comma separated)
                        </label>
                        <input
                          type="text"
                          value={edu.honors_and_awards?.join(', ') || ''}
                          onChange={(e) => updateField(`education[${eIdx}].honors_and_awards`, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="Dean's List, Summa Cum Laude"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                          Activities (comma separated)
                        </label>
                        <input
                          type="text"
                          value={edu.activities?.join(', ') || ''}
                          onChange={(e) => updateField(`education[${eIdx}].activities`, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="ACM Student Chapter, Hackathon Lead"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addEducationEntry}
                    className="w-full py-2 border border-dashed border-green-300 text-green-700 bg-green-50/50 hover:bg-green-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Education Entry
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
            <div key="skills_and_interests" className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection('skills_and_interests')}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
                  <div className="p-1 rounded bg-amber-100 text-amber-700">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <span>Certifications, Skills &amp; Interests</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-3.5 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Technologies (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.technologies?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.technologies', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="React, Next.js, TypeScript, Node.js, Python, PostgreSQL"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Skills &amp; Methodologies (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.skills?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.skills', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Full-Stack Development, System Architecture, CI/CD, Agile"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Certifications (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.certifications?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.certifications', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="AWS Certified Solutions Architect, Google Cloud Professional"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Interests (comma separated)
                    </label>
                    <input
                      type="text"
                      value={skills.interests?.join(', ') || ''}
                      onChange={(e) => updateField('skills_and_interests.interests', e.target.value.split(',').map(s => s.trim()))}
                      placeholder="Open Source, Distributed Systems, Chess"
                      className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            <div key={sectionId} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                onClick={() => toggleSection(sectionId)}
                className="w-full flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
                  <div className="p-1 rounded bg-purple-100 text-purple-700">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <span>{customSec.section_title || 'Custom Section'}</span>
                  <span className="text-[11px] font-normal text-gray-500">
                    ({customSec.items?.length || 0} entries)
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 space-y-4 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={customSec.section_title}
                        onChange={(e) => updateField(`${basePath}.section_title`, e.target.value.toUpperCase())}
                        placeholder="e.g. FEATURED PROJECTS"
                        className="w-full px-2.5 py-1 text-xs uppercase font-bold border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete section "${customSec.section_title}"?`)) {
                          removeCustomSection(customSec.id);
                        }
                      }}
                      className="mt-5 p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {customSec.items.map((item, itemIdx) => {
                    const itemPath = `${basePath}.items[${itemIdx}]`;
                    return (
                      <div key={itemIdx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                          <span className="text-[11px] font-bold text-gray-600 uppercase">
                            Entry #{itemIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomSectionItem(customSec.id, itemIdx)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                            title="Remove Entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500">Title / Project Name</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateField(`${itemPath}.title`, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500">Dates</label>
                            <input
                              type="text"
                              value={item.dates || ''}
                              onChange={(e) => updateField(`${itemPath}.dates`, e.target.value)}
                              placeholder="2023 – 2024"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500">Subtitle / Tech</label>
                            <input
                              type="text"
                              value={item.subtitle || ''}
                              onChange={(e) => updateField(`${itemPath}.subtitle`, e.target.value)}
                              placeholder="Next.js, Tailwind, TypeScript"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500">Location / URL</label>
                            <input
                              type="text"
                              value={item.location || ''}
                              onChange={(e) => updateField(`${itemPath}.location`, e.target.value)}
                              placeholder="github.com/project"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-semibold text-gray-500">
                              Bullets ({item.description?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => addArrayItem(`${itemPath}.description`, 'Delivered high-impact capability with measurable success.')}
                              className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-medium cursor-pointer"
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
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeArrayItem(`${itemPath}.description`, bIdx)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer"
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
                    className="w-full py-1.5 border border-dashed border-purple-300 text-purple-700 bg-purple-50/50 hover:bg-purple-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Entry to {customSec.section_title}
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
            className="w-full py-2.5 border border-dashed border-blue-400 text-blue-700 bg-blue-50/60 hover:bg-blue-100/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" /> Add New Section (Projects, Awards, Publications)
          </button>
        </div>
      )}
    </div>
  );
}
