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

export { formatResumeDataToText } from '@/lib/format-resume';

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      savedProfile: null,
      isAuthModalOpen: false,

      login: (name: string, email: string) => {
        const id = 'usr_' + Date.now().toString(36);
        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim() || 'User';

        set({ 
          user: { id, name: cleanName, email: cleanEmail },
          isAuthModalOpen: false
        });

        // Asynchronously check if backend has a saved profile for this user
        if (typeof window !== 'undefined') {
          fetch(`/api/user/profile?email=${encodeURIComponent(cleanEmail)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.savedProfile && !get().savedProfile) {
                set({ savedProfile: data.savedProfile });
              }
            })
            .catch(() => {});
        }
      },

      logout: () => {
        set({ user: null });
      },

      saveProfile: (resumeData: ResumeData, templateSettings: TemplateSettings) => {
        const newProfile: SavedUserProfile = {
          resumeData,
          templateSettings,
          updatedAt: new Date().toISOString()
        };

        set({ savedProfile: newProfile });

        // Asynchronously persist to server profile storage for browser extension & multi-client access
        const currentUser = get().user;
        if (currentUser?.email && typeof window !== 'undefined') {
          fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: currentUser.email,
              name: currentUser.name,
              savedProfile: newProfile
            })
          }).catch((err) => console.warn('Could not sync profile to server:', err));
        }
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
