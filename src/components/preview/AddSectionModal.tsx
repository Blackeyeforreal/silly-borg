'use client';

import React, { useState } from 'react';
import { X, Plus, FolderGit2, Award, BookOpen, Users, Trophy, Sparkles } from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SectionPreset {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultItem: {
    title: string;
    subtitle: string;
    dates: string;
    location: string;
    description: string[];
  };
}

const PRESETS: SectionPreset[] = [
  {
    id: 'projects',
    title: 'Projects',
    description: 'Personal, academic, or open-source software projects',
    icon: <FolderGit2 className="w-5 h-5 text-blue-600" />,
    defaultItem: {
      title: 'Full-Stack Web Application',
      subtitle: 'Next.js, TypeScript, PostgreSQL, Tailwind CSS',
      dates: '2024',
      location: 'github.com/username/project',
      description: [
        'Designed and deployed an end-to-end cloud platform supporting 5,000+ active users.',
        'Engineered responsive UI and implemented JWT authentication with Redis session caching.'
      ]
    }
  },
  {
    id: 'publications',
    title: 'Publications & Research',
    description: 'Academic papers, conference presentations, or technical articles',
    icon: <BookOpen className="w-5 h-5 text-indigo-600" />,
    defaultItem: {
      title: 'Optimizing Distributed Cache Invalidation in Microservice Architectures',
      subtitle: 'IEEE International Conference on Cloud Computing',
      dates: 'May 2023',
      location: 'San Francisco, CA',
      description: [
        'Co-authored peer-reviewed research on low-latency state synchronization in distributed databases.'
      ]
    }
  },
  {
    id: 'volunteering',
    title: 'Leadership & Volunteering',
    description: 'Student leadership, community service, or mentorship',
    icon: <Users className="w-5 h-5 text-emerald-600" />,
    defaultItem: {
      title: 'President & Technical Lead',
      subtitle: 'ACM Student Chapter',
      dates: '2022 – 2023',
      location: 'University Campus',
      description: [
        'Organized 12+ hands-on technical workshops and coordinated annual 48-hour collegiate hackathon.'
      ]
    }
  },
  {
    id: 'awards',
    title: 'Awards & Honors',
    description: 'Competitions, scholarships, or organizational recognition',
    icon: <Trophy className="w-5 h-5 text-amber-600" />,
    defaultItem: {
      title: '1st Place Winner — National Hackathon',
      subtitle: 'Issued by Tech Innovation Summit',
      dates: 'Oct 2023',
      location: 'National Level',
      description: [
        'Awarded first place among 200+ competing teams for building an AI-powered accessibility solution.'
      ]
    }
  },
  {
    id: 'certifications',
    title: 'Certifications & Licenses',
    description: 'Industry-recognized credentials, licenses, or professional training',
    icon: <Award className="w-5 h-5 text-purple-600" />,
    defaultItem: {
      title: 'AWS Certified Solutions Architect – Associate',
      subtitle: 'Amazon Web Services (AWS)',
      dates: 'Issued Jan 2024 · Expires Jan 2027',
      location: 'Credential ID: 12345678',
      description: [
        'Demonstrated expertise in architecting secure, robust, and cost-effective distributed systems on AWS.'
      ]
    }
  }
];

export function AddSectionModal({ isOpen, onClose }: AddSectionModalProps) {
  const { resumeData, addCustomSection, restoreBuiltinSection } = useResumeStore();
  const [customTitle, setCustomTitle] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  if (!isOpen) return null;

  const hasWorkExp = resumeData?.work_experience && resumeData.work_experience.length > 0;
  const hasEdu = resumeData?.education && resumeData.education.length > 0;
  const hasSkills = Boolean(resumeData?.skills_and_interests);

  const handleSelectPreset = (preset: SectionPreset) => {
    addCustomSection(preset.title, preset.defaultItem);
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    addCustomSection(customTitle.trim());
    setCustomTitle('');
    setIsCustom(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Resume Section</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {!isCustom ? (
            <>
              {(!hasWorkExp || !hasEdu || !hasSkills) && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <div className="text-xs font-semibold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <span>Restore Standard Sections</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!hasWorkExp && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('work_experience'); onClose(); }}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded-md hover:bg-amber-100 text-amber-900 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-amber-700" /> Work Experience
                      </button>
                    )}
                    {!hasEdu && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('education'); onClose(); }}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded-md hover:bg-amber-100 text-amber-900 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-amber-700" /> Education
                      </button>
                    )}
                    {!hasSkills && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('skills_and_interests'); onClose(); }}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-amber-300 rounded-md hover:bg-amber-100 text-amber-900 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3 text-amber-700" /> Skills & Interests
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Choose a pre-formatted section to instantly add to your resume, or create a custom section.
              </p>

              <div className="space-y-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-3.5 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-start gap-3.5 group cursor-pointer"
                  >
                    <div className="p-2 rounded-md bg-white border border-gray-200 group-hover:border-blue-300 shadow-xs shrink-0">
                      {preset.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                        {preset.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsCustom(true)}
                  className="w-full py-2.5 px-4 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                  Create Custom Section with Title
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patents, Speaking Engagements, Military Experience"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customTitle.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Add Section
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
