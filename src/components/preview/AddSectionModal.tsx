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
    title: 'Featured Projects',
    description: 'Personal, open-source, or commercial engineering projects',
    icon: <FolderGit2 className="w-4 h-4 text-[#993322]" />,
    defaultItem: {
      title: 'Full-Stack Distributed Application',
      subtitle: 'Next.js, TypeScript, PostgreSQL, Tailwind CSS',
      dates: '2024',
      location: 'github.com/username/project',
      description: [
        'Designed and deployed high-availability platform serving 5,000+ active users.',
        'Engineered responsive architecture with low-latency session caching and strict type safety.'
      ]
    }
  },
  {
    id: 'publications',
    title: 'Publications & Research',
    description: 'Peer-reviewed academic papers, conference talks, or whitepapers',
    icon: <BookOpen className="w-4 h-4 text-[#993322]" />,
    defaultItem: {
      title: 'Optimizing Distributed Cache Invalidation in Microservice Architectures',
      subtitle: 'IEEE International Conference on Cloud Computing',
      dates: 'May 2023',
      location: 'San Francisco, CA',
      description: [
        'Co-authored research on sub-millisecond state synchronization across distributed clusters.'
      ]
    }
  },
  {
    id: 'volunteering',
    title: 'Leadership & Volunteering',
    description: 'Community leadership, open source stewardship, or mentorship',
    icon: <Users className="w-4 h-4 text-[#993322]" />,
    defaultItem: {
      title: 'President & Technical Director',
      subtitle: 'ACM Student Chapter',
      dates: '2022 – 2023',
      location: 'University Campus',
      description: [
        'Organized 12+ hands-on technical workshops and directed annual 48-hour collegiate hackathon.'
      ]
    }
  },
  {
    id: 'awards',
    title: 'Honors & Awards',
    description: 'Competitions, merit scholarships, or corporate distinctions',
    icon: <Trophy className="w-4 h-4 text-[#993322]" />,
    defaultItem: {
      title: '1st Place Laureate — National Hackathon',
      subtitle: 'Issued by Tech Innovation Summit',
      dates: 'Oct 2023',
      location: 'National Level',
      description: [
        'Awarded first place among 200+ competing teams for building high-concurrency accessibility tool.'
      ]
    }
  },
  {
    id: 'certifications',
    title: 'Certifications & Accreditations',
    description: 'Industry certifications, specialized licenses, or verified credentials',
    icon: <Award className="w-4 h-4 text-[#993322]" />,
    defaultItem: {
      title: 'AWS Certified Solutions Architect – Associate',
      subtitle: 'Amazon Web Services (AWS)',
      dates: 'Issued Jan 2024 · Expires Jan 2027',
      location: 'Credential ID: 12345678',
      description: [
        'Demonstrated expertise in architecting resilient, fault-tolerant cloud infrastructures on AWS.'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-[#FDFCFB] rounded-xs shadow-2xl max-w-lg w-full overflow-hidden border border-[#E7E4DC]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E7E4DC] bg-[#F8F7F4]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] uppercase font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs">
              01 · CATALOG
            </span>
            <h2 className="font-serif-display text-lg text-[#141413]">Add Document Section</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[#76736C] hover:text-[#141413] hover:bg-[#EFECE6] rounded-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {!isCustom ? (
            <>
              {(!hasWorkExp || !hasEdu || !hasSkills) && (
                <div className="p-3 bg-[#FAF9F6] border border-dashed border-[#DCD8CE] rounded-xs">
                  <div className="font-mono text-[11px] font-bold text-[#141413] mb-2 uppercase tracking-wider">
                    Restore Archived Sections
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!hasWorkExp && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('work_experience'); onClose(); }}
                        className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider bg-white border border-[#DCD8CE] hover:border-[#141413] text-[#141413] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#993322]" /> Work Experience
                      </button>
                    )}
                    {!hasEdu && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('education'); onClose(); }}
                        className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider bg-white border border-[#DCD8CE] hover:border-[#141413] text-[#141413] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#993322]" /> Education
                      </button>
                    )}
                    {!hasSkills && (
                      <button
                        type="button"
                        onClick={() => { restoreBuiltinSection('skills_and_interests'); onClose(); }}
                        className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider bg-white border border-[#DCD8CE] hover:border-[#141413] text-[#141413] rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#993322]" /> Skills &amp; Interests
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="font-sans text-xs text-[#76736C]">
                Select a standardized structural section to append to the live sheet, or define a bespoke custom category.
              </p>

              <div className="space-y-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="w-full text-left p-3 rounded-xs border border-[#E7E4DC] hover:border-[#141413] bg-white transition-all flex items-start gap-3 group cursor-pointer paper-shadow"
                  >
                    <div className="p-2 rounded-xs bg-[#F8F7F4] border border-[#E7E4DC] shrink-0 mt-0.5">
                      {preset.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#141413]">
                        {preset.title}
                      </h3>
                      <p className="text-[11px] text-[#76736C] mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E7E4DC]">
                <button
                  onClick={() => setIsCustom(true)}
                  className="w-full py-2.5 px-4 font-mono text-xs uppercase tracking-wider text-[#141413] bg-white hover:bg-[#F8F7F4] border border-dashed border-[#DCD8CE] hover:border-[#141413] rounded-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#993322]" />
                  Define Bespoke Section
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">
                  Section Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. PATENTS, SPEAKING ENGAGEMENTS, MILITARY"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-xs uppercase font-mono border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#76736C] hover:text-[#141413] hover:bg-[#EFECE6] border border-[#DCD8CE] rounded-xs transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!customTitle.trim()}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#F8F7F4] bg-[#141413] hover:bg-[#2A2927] rounded-xs border border-[#141413] transition-colors disabled:opacity-50 cursor-pointer"
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
