'use client';

import React from 'react';
import { 
  FileEdit, 
  ArrowUpDown, 
  Palette, 
  PanelLeftClose, 
  PanelRightClose,
  PanelLeft,
  PanelRight,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { SectionForms } from './SectionForms';
import { SectionReorderPanel } from './SectionReorderPanel';
import { TemplateDesignPanel } from './TemplateDesignPanel';

interface ResumeSidebarProps {
  onOpenAddSectionModal?: () => void;
}

export function ResumeSidebar({ onOpenAddSectionModal }: ResumeSidebarProps) {
  const { 
    sidebarTab, 
    setSidebarTab, 
    isSidebarOpen, 
    setSidebarOpen, 
    toggleSidebar,
    sidebarPosition, 
    setSidebarPosition 
  } = useResumeStore();

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className={`fixed z-30 top-20 ${
          sidebarPosition === 'left' ? 'left-4' : 'right-4'
        } bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 shadow-md rounded-xl p-2.5 flex items-center gap-2 text-xs font-semibold transition-all hover:scale-105 cursor-pointer no-print`}
        title="Open Editor Panel"
      >
        {sidebarPosition === 'left' ? <PanelLeft className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
        <span>Editor &amp; Design</span>
      </button>
    );
  }

  const isLeft = sidebarPosition === 'left';

  return (
    <aside
      className={`w-full lg:w-[420px] xl:w-[460px] shrink-0 bg-white border-gray-200 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 z-30 shadow-lg no-print transition-all ${
        isLeft ? 'border-r' : 'border-l'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">Resume Studio</h2>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Dock Left / Right Toggle */}
          <button
            type="button"
            onClick={() => setSidebarPosition(isLeft ? 'right' : 'left')}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 rounded-md transition-colors cursor-pointer"
            title={isLeft ? 'Dock to Right Side' : 'Dock to Left Side'}
          >
            {isLeft ? (
              <PanelRight className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>

          {/* Close / Minimize Panel */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 rounded-md transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            {isLeft ? <PanelLeftClose className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-100/70 p-1 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setSidebarTab('forms')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg font-medium transition-all cursor-pointer ${
            sidebarTab === 'forms'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Forms</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('rearrange')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg font-medium transition-all cursor-pointer ${
            sidebarTab === 'rearrange'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Rearrange</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('design')}
          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg font-medium transition-all cursor-pointer ${
            sidebarTab === 'design'
              ? 'bg-white text-purple-700 shadow-xs font-semibold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Template</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {sidebarTab === 'forms' && (
          <SectionForms onOpenAddSectionModal={onOpenAddSectionModal} />
        )}
        {sidebarTab === 'rearrange' && (
          <SectionReorderPanel onOpenAddSectionModal={onOpenAddSectionModal} />
        )}
        {sidebarTab === 'design' && (
          <TemplateDesignPanel />
        )}
      </div>
    </aside>
  );
}
