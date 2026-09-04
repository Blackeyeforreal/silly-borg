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
  
  setResumeData: (data: ResumeData | null) => void;
  updateField: (path: string, value: any) => void;
  addArrayItem: (path: string, value: any) => void;
  removeArrayItem: (path: string, index: number) => void;
  setActiveEditingPath: (path: string | null) => void;
  setTemplateSettings: (settings: Partial<TemplateSettings>) => void;
  resetTemplateSettings: () => void;
  setJobDescription: (desc: string) => void;
  setOriginalResumeText: (text: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setGenerationStep: (step: string) => void;
  addCustomSection: (title: string, initialItem?: CustomSectionItem) => void;
  removeCustomSection: (sectionId: string) => void;
  addCustomSectionItem: (sectionId: string) => void;
  removeCustomSectionItem: (sectionId: string, itemIndex: number) => void;
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

      setActiveEditingPath: (path) => set({ activeEditingPath: path }),
      setTemplateSettings: (settings) => set((state) => ({
        templateSettings: { ...state.templateSettings, ...settings }
      })),
      resetTemplateSettings: () => set({ templateSettings: DEFAULT_TEMPLATE_SETTINGS }),

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
        const newSection: CustomSection = {
          id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
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
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: [...currentSections, newSection]
          }
        };
      }),

      removeCustomSection: (sectionId) => set((state) => {
        if (!state.resumeData || !state.resumeData.custom_sections) return state;
        return {
          resumeData: {
            ...state.resumeData,
            custom_sections: state.resumeData.custom_sections.filter(s => s.id !== sectionId)
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
      })
    }),
    {
      limit: 50,
      partialize: (state) => ({ resumeData: state.resumeData })
    }
  )
);
