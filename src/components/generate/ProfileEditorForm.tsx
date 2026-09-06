'use client';

import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  FolderGit2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Globe, 
  Link2, 
  Code2, 
  BookmarkCheck, 
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { ResumeData, CustomSection } from '@/lib/schema';
import { useUserStore } from '@/store/user-store';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/components/ui/Toast';

interface ProfileEditorFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onSwitchToRawText?: () => void;
}

export function ProfileEditorForm({ data, onChange, onSwitchToRawText }: ProfileEditorFormProps) {
  const { user, saveProfile, setAuthModalOpen } = useUserStore();
  const templateSettings = useResumeStore(state => state.templateSettings);
  const { addToast } = useToast();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    projects: true,
    experience: true,
    education: false,
    skills: true
  });

  const toggleSection = (sec: string) => {
    setExpandedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Helper deep update
  const updatePersonalInfo = (field: string, value: string) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    if (!updated.personal_info) {
      updated.personal_info = {
        full_name: '',
        contact: { email: '', phone: '', location: '', links: '', portfolio: '', linkedin: '', github: '' }
      };
    }
    if (field === 'full_name') {
      updated.personal_info.full_name = value;
    } else {
      if (!updated.personal_info.contact) {
        updated.personal_info.contact = { email: '', phone: '', location: '', links: '', portfolio: '', linkedin: '', github: '' };
      }
      (updated.personal_info.contact as any)[field] = value;
    }
    onChange(updated);
  };

  // Projects helper (stored in custom_sections with id 'custom_section_projects' or title 'PROJECTS')
  const getProjectsSection = (): { section: CustomSection; index: number } | null => {
    if (!data.custom_sections || data.custom_sections.length === 0) return null;
    const idx = data.custom_sections.findIndex(
      s => s.id === 'custom_section_projects' || s.section_title.toUpperCase().includes('PROJECT')
    );
    if (idx === -1) return null;
    return { section: data.custom_sections[idx], index: idx };
  };

  const ensureProjectsSection = (): { updated: ResumeData; index: number } => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    if (!updated.custom_sections) updated.custom_sections = [];
    let idx = updated.custom_sections.findIndex(
      s => s.id === 'custom_section_projects' || s.section_title.toUpperCase().includes('PROJECT')
    );
    if (idx === -1) {
      updated.custom_sections.push({
        id: 'custom_section_projects',
        section_title: 'PROJECTS',
        items: []
      });
      idx = updated.custom_sections.length - 1;
    }
    return { updated, index: idx };
  };

  const handleAddProject = () => {
    const { updated, index } = ensureProjectsSection();
    updated.custom_sections![index].items.push({
      title: 'New Project',
      subtitle: 'React, TypeScript, Tailwind',
      dates: new Date().getFullYear().toString(),
      location: '',
      link: 'https://',
      description: ['Built and launched feature with measurable performance gains.']
    });
    onChange(updated);
    setExpandedSections(prev => ({ ...prev, projects: true }));
  };

  const handleUpdateProject = (pIdx: number, field: string, val: any) => {
    const { updated, index } = ensureProjectsSection();
    const item = updated.custom_sections![index].items[pIdx];
    if (item) {
      (item as any)[field] = val;
      onChange(updated);
    }
  };

  const handleRemoveProject = (pIdx: number) => {
    const { updated, index } = ensureProjectsSection();
    updated.custom_sections![index].items.splice(pIdx, 1);
    onChange(updated);
  };

  const handleAddProjectBullet = (pIdx: number) => {
    const { updated, index } = ensureProjectsSection();
    const item = updated.custom_sections![index].items[pIdx];
    if (item) {
      item.description = item.description || [];
      item.description.push('Describe a key responsibility, metric, or technical accomplishment.');
      onChange(updated);
    }
  };

  const handleUpdateProjectBullet = (pIdx: number, bIdx: number, text: string) => {
    const { updated, index } = ensureProjectsSection();
    const item = updated.custom_sections![index].items[pIdx];
    if (item && item.description) {
      item.description[bIdx] = text;
      onChange(updated);
    }
  };

  const handleRemoveProjectBullet = (pIdx: number, bIdx: number) => {
    const { updated, index } = ensureProjectsSection();
    const item = updated.custom_sections![index].items[pIdx];
    if (item && item.description) {
      item.description.splice(bIdx, 1);
      onChange(updated);
    }
  };

  // Work experience helpers
  const handleAddCompany = () => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    if (!updated.work_experience) updated.work_experience = [];
    updated.work_experience.push({
      company: 'New Company',
      dates: '2023 – Present',
      roles: [{
        title: 'Software Engineer',
        location: 'Remote',
        dates: '2023 – Present',
        description: ['Architected core platform services with high reliability.'],
        technologies_used: ['TypeScript', 'Node.js']
      }]
    });
    onChange(updated);
  };

  const handleRemoveCompany = (cIdx: number) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    updated.work_experience.splice(cIdx, 1);
    onChange(updated);
  };

  const handleUpdateCompany = (cIdx: number, field: string, val: string) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    (updated.work_experience[cIdx] as any)[field] = val;
    onChange(updated);
  };

  const handleUpdateRole = (cIdx: number, rIdx: number, field: string, val: any) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    (updated.work_experience[cIdx].roles[rIdx] as any)[field] = val;
    onChange(updated);
  };

  const handleAddRoleBullet = (cIdx: number, rIdx: number) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    updated.work_experience[cIdx].roles[rIdx].description.push('Engineered scalable solution boosting user engagement.');
    onChange(updated);
  };

  const handleUpdateRoleBullet = (cIdx: number, rIdx: number, bIdx: number, text: string) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    updated.work_experience[cIdx].roles[rIdx].description[bIdx] = text;
    onChange(updated);
  };

  const handleRemoveRoleBullet = (cIdx: number, rIdx: number, bIdx: number) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    updated.work_experience[cIdx].roles[rIdx].description.splice(bIdx, 1);
    onChange(updated);
  };

  // Education helpers
  const handleAddEducation = () => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    if (!updated.education) updated.education = [];
    updated.education.push({
      university: 'University Name',
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      graduation_date: new Date().getFullYear().toString(),
      location: 'City, State',
      honors_and_awards: [],
      activities: []
    });
    onChange(updated);
  };

  const handleRemoveEducation = (eIdx: number) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    updated.education.splice(eIdx, 1);
    onChange(updated);
  };

  const handleUpdateEducation = (eIdx: number, field: string, val: any) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    (updated.education[eIdx] as any)[field] = val;
    onChange(updated);
  };

  // Skills helpers
  const handleUpdateSkills = (field: string, val: string[]) => {
    const updated = JSON.parse(JSON.stringify(data)) as ResumeData;
    if (!updated.skills_and_interests) {
      updated.skills_and_interests = { skills: [], technologies: [] };
    }
    (updated.skills_and_interests as any)[field] = val;
    onChange(updated);
  };

  const handleSaveToProfile = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    saveProfile(data, templateSettings);
    addToast('Profile saved to your account! It will be used for future resume tailoring.', 'success');
  };

  const projectsInfo = getProjectsSection();
  const projectItems = projectsInfo?.section.items || [];

  return (
    <div className="space-y-4 text-sm">
      {/* Top Banner with Quick Actions */}
      <div className="p-3.5 bg-[#F7F5F0] border border-[#DCD8CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-4 h-4 bg-[#141413] text-[#FDFCFB] text-[10px] font-mono font-bold">✓</span>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#141413]">01 / Structured Profile Extracted</span>
          </div>
          <p className="text-[11px] text-[#706E6B] mt-0.5 font-sans">
            Review and edit your details, add live demo/GitHub links for projects, or save directly to your master account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onSwitchToRawText && (
            <button
              type="button"
              onClick={onSwitchToRawText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[#141413] bg-white hover:bg-[#F2EFE9] border border-[#DCD8CE] transition-colors cursor-pointer"
              title="View and edit as plain text"
            >
              <FileText className="w-3.5 h-3.5 text-[#8C887B]" />
              Raw Text
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveToProfile}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-[#FDFCFB] bg-[#141413] hover:bg-black transition-colors cursor-pointer shadow-sm"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            {user ? 'Save to Master Profile' : 'Log In & Save'}
          </button>
        </div>
      </div>

      {/* SECTION 1: PERSONAL INFORMATION & PORTFOLIO LINKS */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('personal')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <User className="w-4 h-4" />
            </div>
            <span>Personal Information &amp; Social Links</span>
          </div>
          {expandedSections.personal ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>

        {expandedSections.personal && (
          <div className="p-4 space-y-3.5 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={data.personal_info?.full_name || ''}
                onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={data.personal_info?.contact?.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={data.personal_info?.contact?.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={data.personal_info?.contact?.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Profile & Social Links */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Portfolio &amp; Profiles</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    Portfolio / Website
                  </label>
                  <input
                    type="url"
                    value={data.personal_info?.contact?.portfolio || ''}
                    onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                    placeholder="https://janedoe.dev"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Link2 className="w-3.5 h-3.5 text-sky-600" />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={data.personal_info?.contact?.linkedin || ''}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/janedoe"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sky-700"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <Code2 className="w-3.5 h-3.5 text-gray-800" />
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={data.personal_info?.contact?.github || ''}
                    onChange={(e) => updatePersonalInfo('github', e.target.value)}
                    placeholder="https://github.com/janedoe"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: PROJECTS & PORTFOLIO (WITH PROJECT LINKS) */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('projects')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1.5 bg-[#F7F5F0] text-[#141413] border border-[#DCD8CE]">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <span>Featured Projects &amp; Demos</span>
            <span className="text-[10px] font-mono text-[#706E6B] bg-[#F7F5F0] px-2 py-0.5 border border-[#DCD8CE]">
              {projectItems.length} {projectItems.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          {expandedSections.projects ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>

        {expandedSections.projects && (
          <div className="p-4 space-y-4 border-t border-[#EFECE6]">
            {projectItems.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#DCD8CE] bg-[#F7F5F0]">
                <p className="text-xs text-[#706E6B] mb-2 font-mono">No projects added yet.</p>
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[#141413] bg-white hover:bg-[#F2EFE9] border border-[#DCD8CE] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projectItems.map((project, pIdx) => (
                  <div key={pIdx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 relative group">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Project #{pIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(pIdx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={project.title}
                          onChange={(e) => handleUpdateProject(pIdx, 'title', e.target.value)}
                          placeholder="e.g. AI Resume Tailor"
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Live Demo / Repository URL
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="url"
                            value={project.link || ''}
                            onChange={(e) => handleUpdateProject(pIdx, 'link', e.target.value)}
                            placeholder="https://github.com/user/project or https://demo.app"
                            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-8 text-blue-700 font-mono"
                          />
                          {project.link && (
                            <a
                              href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-2 text-gray-400 hover:text-blue-600 p-1"
                              title="Test link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle / Technologies Used</label>
                        <input
                          type="text"
                          value={project.subtitle || ''}
                          onChange={(e) => handleUpdateProject(pIdx, 'subtitle', e.target.value)}
                          placeholder="Next.js, TypeScript, Tailwind, Gemini API"
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Dates</label>
                        <input
                          type="text"
                          value={project.dates || ''}
                          onChange={(e) => handleUpdateProject(pIdx, 'dates', e.target.value)}
                          placeholder="2024"
                          className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-gray-600">
                          Highlights &amp; Bullet Points ({project.description?.length || 0})
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddProjectBullet(pIdx)}
                          className="text-[11px] font-mono uppercase tracking-wider text-[#141413] hover:text-[#993322] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Bullet
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(project.description || []).map((bullet, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-[#8C887B] mt-2 text-xs font-mono">•</span>
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) => handleUpdateProjectBullet(pIdx, bIdx, e.target.value)}
                              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#DCD8CE] focus:border-[#141413] outline-none resize-y font-sans text-[#141413]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectBullet(pIdx, bIdx)}
                              className="p-1.5 text-[#8C887B] hover:text-[#993322] transition-colors mt-0.5"
                              title="Delete Bullet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddProject}
                  className="w-full py-2.5 border border-dashed border-[#DCD8CE] text-[#141413] bg-[#F7F5F0] hover:bg-[#EFECE6] font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Another Project
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: WORK EXPERIENCE */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('experience')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <span>Work Experience</span>
            <span className="text-[11px] font-normal text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              {data.work_experience?.length || 0} companies
            </span>
          </div>
          {expandedSections.experience ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>

        {expandedSections.experience && (
          <div className="p-4 space-y-4 border-t border-gray-100">
            {(data.work_experience || []).map((exp, cIdx) => (
              <div key={cIdx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 space-y-3 relative group">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Company #{cIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCompany(cIdx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Company"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleUpdateCompany(cIdx, 'company', e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tenure / Dates</label>
                    <input
                      type="text"
                      value={exp.dates}
                      onChange={(e) => handleUpdateCompany(cIdx, 'dates', e.target.value)}
                      placeholder="e.g. 2021 – Present"
                      className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Roles under this company */}
                <div className="space-y-3 pt-2">
                  {exp.roles.map((role, rIdx) => (
                    <div key={rIdx} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Role Title</label>
                          <input
                            type="text"
                            value={role.title}
                            onChange={(e) => handleUpdateRole(cIdx, rIdx, 'title', e.target.value)}
                            placeholder="Senior Software Engineer"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Location</label>
                          <input
                            type="text"
                            value={role.location}
                            onChange={(e) => handleUpdateRole(cIdx, rIdx, 'location', e.target.value)}
                            placeholder="San Francisco, CA"
                            className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Optional Role Link */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Project / Role Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={role.link || ''}
                          onChange={(e) => handleUpdateRole(cIdx, rIdx, 'link', e.target.value)}
                          placeholder="https://company.com/product"
                          className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-blue-700"
                        />
                      </div>

                      {/* Bullet points */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-600">
                            Achievements ({role.description?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddRoleBullet(cIdx, rIdx)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {(role.description || []).map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-1">
                              <span className="text-gray-400 mt-2 text-xs">•</span>
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => handleUpdateRoleBullet(cIdx, rIdx, bIdx, e.target.value)}
                                className="flex-1 px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveRoleBullet(cIdx, rIdx, bIdx)}
                                className="p-1 text-gray-400 hover:text-red-500 mt-0.5 cursor-pointer"
                                title="Delete Bullet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddCompany}
              className="w-full py-2.5 border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Another Company
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: EDUCATION */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('education')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span>Education</span>
            <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {data.education?.length || 0} degrees
            </span>
          </div>
          {expandedSections.education ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>

        {expandedSections.education && (
          <div className="p-4 space-y-4 border-t border-gray-100">
            {(data.education || []).map((edu, eIdx) => (
              <div key={eIdx} className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/40 space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-700 uppercase">Degree #{eIdx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(eIdx)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                    title="Remove Degree"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">University / College</label>
                    <input
                      type="text"
                      value={edu.university}
                      onChange={(e) => handleUpdateEducation(eIdx, 'university', e.target.value)}
                      placeholder="e.g. Stanford University"
                      className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Graduation Date</label>
                    <input
                      type="text"
                      value={edu.graduation_date}
                      onChange={(e) => handleUpdateEducation(eIdx, 'graduation_date', e.target.value)}
                      placeholder="e.g. May 2023"
                      className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleUpdateEducation(eIdx, 'degree', e.target.value)}
                      placeholder="Bachelor of Science"
                      className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Major</label>
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => handleUpdateEducation(eIdx, 'major', e.target.value)}
                      placeholder="Computer Science"
                      className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddEducation}
              className="w-full py-2 border border-dashed border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Education Entry
            </button>
          </div>
        )}
      </div>

      {/* SECTION 5: SKILLS & CERTIFICATIONS */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <button
          type="button"
          onClick={() => toggleSection('skills')}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-gray-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-xs sm:text-sm">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Wrench className="w-4 h-4" />
            </div>
            <span>Skills, Technologies &amp; Certifications</span>
          </div>
          {expandedSections.skills ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
        </button>

        {expandedSections.skills && (
          <div className="p-4 space-y-3.5 border-t border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Technologies &amp; Languages (comma separated)
              </label>
              <input
                type="text"
                value={data.skills_and_interests?.technologies?.join(', ') || ''}
                onChange={(e) => handleUpdateSkills('technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="React, Next.js, TypeScript, Python, Node.js, PostgreSQL, Docker"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Skills &amp; Methodologies (comma separated)
              </label>
              <input
                type="text"
                value={data.skills_and_interests?.skills?.join(', ') || ''}
                onChange={(e) => handleUpdateSkills('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="System Design, Microservices, CI/CD, Agile, Performance Optimization"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Certifications (comma separated)
              </label>
              <input
                type="text"
                value={data.skills_and_interests?.certifications?.join(', ') || ''}
                onChange={(e) => handleUpdateSkills('certifications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="AWS Certified Solutions Architect, GCP Professional Cloud Architect"
                className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
