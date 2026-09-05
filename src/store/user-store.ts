'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ResumeData } from '@/lib/schema';
import type { TemplateSettings } from './resume-store';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
}

export interface SavedUserProfile {
  resumeData: ResumeData;
  templateSettings: TemplateSettings;
  updatedAt: string;
}

interface UserState {
  user: UserAccount | null;
  savedProfile: SavedUserProfile | null;
  isAuthModalOpen: boolean;

  login: (name: string, email: string) => void;
  logout: () => void;
  saveProfile: (resumeData: ResumeData, templateSettings: TemplateSettings) => void;
  clearProfile: () => void;
  setAuthModalOpen: (open: boolean) => void;
}

export function formatResumeDataToText(data: ResumeData): string {
  const parts: string[] = [];

  if (data.personal_info?.full_name) {
    parts.push(`FULL NAME: ${data.personal_info.full_name}`);
  }

  const c = data.personal_info?.contact;
  if (c) {
    const contactParts = [c.email, c.phone, c.location, c.links].filter(Boolean);
    if (contactParts.length) {
      parts.push(`CONTACT: ${contactParts.join(' | ')}`);
    }
  }

  if (data.work_experience && data.work_experience.length > 0) {
    parts.push('\nWORK EXPERIENCE:');
    for (const exp of data.work_experience) {
      parts.push(`- Company: ${exp.company} (${exp.dates})`);
      for (const r of exp.roles) {
        parts.push(`  Role: ${r.title}${r.location ? ` | ${r.location}` : ''}${r.dates ? ` | ${r.dates}` : ''}`);
        for (const d of r.description || []) {
          parts.push(`    * ${d}`);
        }
        if (r.key_results && r.key_results.length > 0) {
          parts.push(`    Key Results: ${r.key_results.join('; ')}`);
        }
        if (r.technologies_used && r.technologies_used.length > 0) {
          parts.push(`    Technologies Used: ${r.technologies_used.join(', ')}`);
        }
      }
    }
  }

  if (data.education && data.education.length > 0) {
    parts.push('\nEDUCATION:');
    for (const edu of data.education) {
      parts.push(`- ${edu.university} | ${edu.degree}${edu.major ? `, ${edu.major}` : ''} (${edu.graduation_date})${edu.location ? ` | ${edu.location}` : ''}`);
      if (edu.honors_and_awards && edu.honors_and_awards.length > 0) {
        parts.push(`  Honors & Awards: ${edu.honors_and_awards.join(', ')}`);
      }
      if (edu.activities && edu.activities.length > 0) {
        parts.push(`  Activities: ${edu.activities.join(', ')}`);
      }
    }
  }

  if (data.skills_and_interests) {
    const s = data.skills_and_interests;
    parts.push('\nCERTIFICATIONS, SKILLS & INTERESTS:');
    if (s.certifications && s.certifications.length > 0) {
      parts.push(`- Certifications: ${s.certifications.join(', ')}`);
    }
    if (s.technologies && s.technologies.length > 0) {
      parts.push(`- Technologies: ${s.technologies.join(', ')}`);
    }
    if (s.skills && s.skills.length > 0) {
      parts.push(`- Skills: ${s.skills.join(', ')}`);
    }
    if (s.interests && s.interests.length > 0) {
      parts.push(`- Interests: ${s.interests.join(', ')}`);
    }
  }

  if (data.custom_sections && data.custom_sections.length > 0) {
    for (const sec of data.custom_sections) {
      parts.push(`\n${sec.section_title}:`);
      for (const item of sec.items) {
        parts.push(`- ${item.title}${item.subtitle ? ` (${item.subtitle})` : ''}${item.dates ? ` [${item.dates}]` : ''}${item.location ? ` [${item.location}]` : ''}`);
        for (const b of item.description || []) {
          parts.push(`    * ${b}`);
        }
      }
    }
  }

  return parts.join('\n');
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      savedProfile: null,
      isAuthModalOpen: false,

      login: (name: string, email: string) => {
        const id = 'usr_' + Date.now().toString(36);
        set({ 
          user: { id, name: name.trim() || 'User', email: email.trim().toLowerCase() },
          isAuthModalOpen: false
        });
      },

      logout: () => {
        set({ user: null });
      },

      saveProfile: (resumeData: ResumeData, templateSettings: TemplateSettings) => {
        set({
          savedProfile: {
            resumeData,
            templateSettings,
            updatedAt: new Date().toISOString()
          }
        });
      },

      clearProfile: () => {
        set({ savedProfile: null });
      },

      setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open })
    }),
    {
      name: 'resume-builder-user-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      })),
      partialize: (state) => ({
        user: state.user,
        savedProfile: state.savedProfile
      })
    }
  )
);
