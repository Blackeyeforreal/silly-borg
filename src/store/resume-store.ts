import { create } from 'zustand';
import { temporal } from 'zundo';
import { ResumeData, CustomSection, CustomSectionItem } from '../lib/schema';

// Helper to parse path strings like "work_experience[0].roles[1].title"
function parsePath(path: string): string[] {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
}

export function setNestedValue(obj: any, path: string, value: any): any {
  if (!obj) return obj;
  const keys = parsePath(path);
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = result;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextKeyArrayIndex = !isNaN(parseInt(nextKey, 10));
    
    if (current[key] === undefined || current[key] === null) {
      current[key] = isNextKeyArrayIndex ? [] : {};
    } else {
      current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}

export function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  const keys = parsePath(path);
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

export function addToArray(obj: any, path: string, value: any): any {
  const currentArray = getNestedValue(obj, path) || [];
  return setNestedValue(obj, path, [...currentArray, value]);
}

export function removeFromArray(obj: any, path: string, index: number): any {
  const currentArray = getNestedValue(obj, path);
  if (!Array.isArray(currentArray)) return obj;
  
  const newArray = [...currentArray];
  newArray.splice(index, 1);
  return setNestedValue(obj, path, newArray);
}

export function getEffectiveSectionOrder(resumeData: ResumeData | null): string[] {
  if (!resumeData) return [];
  const validIds: string[] = [];
  if (resumeData.work_experience && resumeData.work_experience.length > 0) {
    validIds.push('work_experience');
  }
  if (resumeData.education && resumeData.education.length > 0) {
    validIds.push('education');
  }
  if (resumeData.skills_and_interests) {
    validIds.push('skills_and_interests');
  }
  if (resumeData.custom_sections) {
    resumeData.custom_sections.forEach((s) => validIds.push(s.id));
  }

  const existingOrder = (resumeData.section_order || []).filter((id) => validIds.includes(id));
  const missing = validIds.filter((id) => !existingOrder.includes(id));
  return [...existingOrder, ...missing];
}

export interface TemplateSettings {
  fontFamily: 'Garamond' | 'Times New Roman' | 'Georgia' | 'Calibri' | 'Arial';
  fontSize: 'compact' | 'standard' | 'spacious';
  lineSpacing: 'tight' | 'normal' | 'relaxed';
  marginSize: 'compact' | 'normal' | 'spacious';
  accentColor: string;
}

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  fontFamily: 'Garamond',
  fontSize: 'standard',
  lineSpacing: 'normal',
  marginSize: 'normal',
  accentColor: '#000000',
};

interface ResumeState {
  resumeData: ResumeData | null;
  jobDescription: string;
  originalResumeText: string;
  isGenerating: boolean;
  generationStep: string;
  activeEditingPath: string | null;
  templateSettings: TemplateSettings;
  sidebarTab: 'forms' | 'rearrange' | 'design';
  isSidebarOpen: boolean;
  sidebarPosition: 'left' | 'right';
  activeFormSection: string | null;
  
  setResumeData: (data: ResumeData | null) => void;
  updateField: (path: string, value: any) => void;
  addArrayItem: (path: string, value: any) => void;
  removeArrayItem: (path: string, index: number) => void;
  setActiveEditingPath: (path: string | null) => void;
  setTemplateSettings: (settings: Partial<TemplateSettings>) => void;
  resetTemplateSettings: () => void;
  setSidebarTab: (tab: 'forms' | 'rearrange' | 'design') => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarPosition: (pos: 'left' | 'right') => void;
  setActiveFormSection: (section: string | null) => void;
  reorderSections: (newOrder: string[]) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  setJobDescription: (desc: string) => void;
  setOriginalResumeText: (text: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationStep: (step: string) => void;
  addCustomSection: (title: string, initialItem?: CustomSectionItem) => void;
  removeCustomSection: (sectionId: string) => void;
  addCustomSectionItem: (sectionId: string) => void;
  removeCustomSectionItem: (sectionId: string, itemIndex: number) => void;
  deleteBuiltinSection: (sectionKey: 'work_experience' | 'education' | 'skills_and_interests') => void;
  restoreBuiltinSection: (sectionKey: 'work_experience' | 'education' | 'skills_and_interests') => void;
  addWorkExperienceEntry: () => void;
  removeWorkExperienceEntry: (index: number) => void;
  addEducationEntry: () => void;
  removeEducationEntry: (index: number) => void;
  reset: () => void;
}

export const useResumeStore = create<ResumeState>()(
  temporal(
    (set, get) => ({
      resumeData: null,
      jobDescription: '',
      originalResumeText: '',
      isGenerating: false,
      generationStep: '',
      activeEditingPath: null,
      templateSettings: DEFAULT_TEMPLATE_SETTINGS,
      sidebarTab: 'forms',
      isSidebarOpen: true,
      sidebarPosition: 'left',
      activeFormSection: null,

      setActiveEditingPath: (path) => set({ activeEditingPath: path }),
      setTemplateSettings: (settings) => set((state) => ({
        templateSettings: { ...state.templateSettings, ...settings }
      })),
      resetTemplateSettings: () => set({ templateSettings: DEFAULT_TEMPLATE_SETTINGS }),
      setSidebarTab: (tab) => set({ sidebarTab: tab, isSidebarOpen: true }),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      setSidebarPosition: (pos) => set({ sidebarPosition: pos }),
      setActiveFormSection: (section) => set({ activeFormSection: section }),

      reorderSections: (newOrder) => set((state) => {
        if (!state.resumeData) return state;
        return {
          resumeData: {
            ...state.resumeData,
            section_order: newOrder
          }
        };
      }),

      moveSection: (sectionId, direction) => set((state) => {
        if (!state.resumeData) return state;
        const currentOrder = getEffectiveSectionOrder(state.resumeData);
        const index = currentOrder.indexOf(sectionId);
        if (index === -1) return state;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentOrder.length) return state;

        const newOrder = [...currentOrder];
        const [removed] = newOrder.splice(index, 1);
        newOrder.splice(targetIndex, 0, removed);

        return {
          resumeData: {
            ...state.resumeData,
            section_order: newOrder
          }
        };
      }),

      setResumeData: (data) => set({ resumeData: data }),
      
      updateField: (path, value) => set((state) => {
        if (!state.resumeData) return state;
        return { resumeData: setNestedValue(state.resumeData, path, value) };
      }),
      
      addArrayItem: (path, value) => set((state) => {
        if (!state.resumeData) return state;
        return { resumeData: addToArray(state.resumeData, path, value) };
      }),
      
      removeArrayItem: (path, index) => set((state) => {
        if (!state.resumeData) return state;
        return { resumeData: removeFromArray(state.resumeData, path, index) };
      }),

      addCustomSection: (title, initialItem) => set((state) => {
        if (!state.resumeData) return state;
        const currentSections = state.resumeData.custom_sections || [];
        const newSectionId = 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newSection: CustomSection = {
          id: newSectionId,
          section_title: title.toUpperCase(),
          items: [
            initialItem || {
              title: 'Project or Entry Name',
              subtitle: 'Role, Framework or Organization',
              dates: '2023 – Present',
              location: 'Remote',
              description: ['Engineered key feature or delivered measurable impact.']
            }
          ]
        };
        const currentOrder = getEffectiveSectionOrder(state.resumeData);
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: [...currentSections, newSection],
            section_order: [...currentOrder, newSectionId]
          }
        };
      }),

      removeCustomSection: (sectionId) => set((state) => {
        if (!state.resumeData || !state.resumeData.custom_sections) return state;
        const currentOrder = getEffectiveSectionOrder(state.resumeData).filter((id) => id !== sectionId);
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: state.resumeData.custom_sections.filter((s) => s.id !== sectionId),
            section_order: currentOrder
          }
        };
      }),

      addCustomSectionItem: (sectionId) => set((state) => {
        if (!state.resumeData || !state.resumeData.custom_sections) return state;
        const updated = state.resumeData.custom_sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            items: [
              ...s.items,
              {
                title: 'New Entry Title',
                subtitle: 'Role / Details',
                dates: '',
                description: ['Accomplishment or key responsibility.']
              }
            ]
          };
        });
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: updated
          }
        };
      }),

      removeCustomSectionItem: (sectionId, itemIndex) => set((state) => {
        if (!state.resumeData || !state.resumeData.custom_sections) return state;
        const updated = state.resumeData.custom_sections.map(s => {
          if (s.id !== sectionId) return s;
          const newItems = s.items.filter((_, i) => i !== itemIndex);
          return { ...s, items: newItems };
        });
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: updated
          }
        };
      }),

      deleteBuiltinSection: (sectionKey) => set((state) => {
        if (!state.resumeData) return state;
        const updated = { ...state.resumeData };
        if (sectionKey === 'work_experience') {
          updated.work_experience = [];
        } else if (sectionKey === 'education') {
          updated.education = [];
        } else if (sectionKey === 'skills_and_interests') {
          updated.skills_and_interests = undefined;
        }
        if (updated.section_order) {
          updated.section_order = updated.section_order.filter((id) => id !== sectionKey);
        }
        return { resumeData: updated };
      }),

      restoreBuiltinSection: (sectionKey) => set((state) => {
        if (!state.resumeData) return state;
        const updated = { ...state.resumeData };
        if (sectionKey === 'work_experience') {
          updated.work_experience = [
            {
              company: 'Company Name',
              dates: '2023 – Present',
              roles: [
                {
                  title: 'Software Engineer',
                  location: 'Location',
                  description: ['Developed and scaled mission-critical features.'],
                  technologies_used: ['TypeScript', 'Node.js']
                }
              ]
            }
          ];
        } else if (sectionKey === 'education') {
          updated.education = [
            {
              university: 'University Name',
              graduation_date: '2023',
              degree: 'Bachelor of Science',
              major: 'Computer Science',
              location: 'City, State'
            }
          ];
        } else if (sectionKey === 'skills_and_interests') {
          updated.skills_and_interests = {
            technologies: ['React', 'Next.js', 'TypeScript', 'Node.js'],
            skills: ['Full-Stack Development', 'System Architecture'],
            interests: ['Open Source', 'Technology']
          };
        }
        const currentOrder = getEffectiveSectionOrder(updated);
        if (!currentOrder.includes(sectionKey)) {
          currentOrder.push(sectionKey);
        }
        updated.section_order = currentOrder;
        return { resumeData: updated };
      }),

      addWorkExperienceEntry: () => set((state) => {
        if (!state.resumeData) return state;
        const current = state.resumeData.work_experience || [];
        return {
          resumeData: {
            ...state.resumeData,
            work_experience: [
              ...current,
              {
                company: 'New Company',
                dates: '2023 – Present',
                roles: [
                  {
                    title: 'Role Title',
                    location: 'City, State',
                    description: ['Key accomplishment or deliverable with measurable impact.']
                  }
                ]
              }
            ]
          }
        };
      }),

      removeWorkExperienceEntry: (index) => set((state) => {
        if (!state.resumeData || !state.resumeData.work_experience) return state;
        const updated = state.resumeData.work_experience.filter((_, i) => i !== index);
        return {
          resumeData: {
            ...state.resumeData,
            work_experience: updated
          }
        };
      }),

      addEducationEntry: () => set((state) => {
        if (!state.resumeData) return state;
        const current = state.resumeData.education || [];
        return {
          resumeData: {
            ...state.resumeData,
            education: [
              ...current,
              {
                university: 'University Name',
                graduation_date: 'Graduation Year',
                degree: 'Bachelor of Science',
                major: 'Major / Field of Study',
                location: 'City, State'
              }
            ]
          }
        };
      }),

      removeEducationEntry: (index) => set((state) => {
        if (!state.resumeData || !state.resumeData.education) return state;
        const updated = state.resumeData.education.filter((_, i) => i !== index);
        return {
          resumeData: {
            ...state.resumeData,
            education: updated
          }
        };
      }),
      
      setJobDescription: (desc) => set({ jobDescription: desc }),
      setOriginalResumeText: (text) => set({ originalResumeText: text }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationStep: (step) => set({ generationStep: step }),
      
      reset: () => set({
        resumeData: null,
        jobDescription: '',
        originalResumeText: '',
        isGenerating: false,
        generationStep: '',
        activeEditingPath: null,
        sidebarTab: 'forms',
        activeFormSection: null,
      })
    }),
    {
      limit: 50,
      partialize: (state) => ({ resumeData: state.resumeData })
    }
  )
);
