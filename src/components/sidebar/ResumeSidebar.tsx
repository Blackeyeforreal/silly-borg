'use client';

import React from 'react';
import { 
  FileEdit, 
  ArrowUpDown, 
  Palette, 
  PanelLeftClose, 
  PanelRightClose,
  PanelLeft,
  PanelRight
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
        className={`fixed z-30 top-16 ${
          sidebarPosition === 'left' ? 'left-3' : 'right-3'
        } neo-btn bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] px-3 py-2 flex items-center gap-2 font-mono text-xs tracking-wider uppercase font-bold transition-all cursor-pointer no-print`}
        title="Open Studio Panel"
      >
        {sidebarPosition === 'left' ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
        <span>Studio Panel</span>
      </button>
    );
  }

  const isLeft = sidebarPosition === 'left';

  return (
    <aside
      className={`w-full lg:w-[420px] xl:w-[460px] shrink-0 bg-[#FDFCFB] flex flex-col h-[calc(100vh-3.25rem)] sticky top-13 z-30 no-print transition-all ${
        isLeft ? 'border-r-2 border-[#141413]' : 'border-l-2 border-[#141413]'
      }`}
    >
      {/* Top Header */}
      <div className="px-4 py-3 border-b-2 border-[#141413] flex items-center justify-between bg-[#FFFDF8]">
        <div className="flex items-center gap-2.5">
          <span className="sticker-pill bg-[#D4FF00] text-[#141413] text-[10px]">
            ⚡ STUDIO
          </span>
          <h2 className="font-serif-display text-lg tracking-tight text-[#141413] leading-none font-bold">
            Records &amp; Specimen
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {/* Dock Left / Right Toggle */}
          <button
            type="button"
            onClick={() => setSidebarPosition(isLeft ? 'right' : 'left')}
            className="p-1.5 text-[#141413] hover:bg-[#EFECE6] border border-[#141413] shadow-[1px_1px_0px_#141413] transition-all cursor-pointer bg-white"
            title={isLeft ? 'Dock to Right Side' : 'Dock to Left Side'}
          >
            {isLeft ? (
              <PanelRight className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close / Minimize Panel */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[#141413] hover:bg-[#EFECE6] border border-[#141413] shadow-[1px_1px_0px_#141413] transition-all cursor-pointer bg-white"
            title="Collapse Studio"
          >
            {isLeft ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelRightClose className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-3 border-b-2 border-[#141413] bg-white text-xs font-mono font-bold">
        <button
          type="button"
          onClick={() => setSidebarTab('forms')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all cursor-pointer border-r-2 border-[#141413] tracking-wider uppercase text-[11px] ${
            sidebarTab === 'forms'
              ? 'bg-[#141413] text-white'
              : 'text-[#141413] hover:bg-[#F2EFE9]'
          }`}
        >
          <FileEdit className="w-3 h-3" />
          <span>Records</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('rearrange')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all cursor-pointer border-r-2 border-[#141413] tracking-wider uppercase text-[11px] ${
            sidebarTab === 'rearrange'
              ? 'bg-[#141413] text-white'
              : 'text-[#141413] hover:bg-[#F2EFE9]'
          }`}
        >
          <ArrowUpDown className="w-3 h-3" />
          <span>Order</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('design')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-2 transition-all cursor-pointer tracking-wider uppercase text-[11px] ${
            sidebarTab === 'design'
              ? 'bg-[#141413] text-white'
              : 'text-[#141413] hover:bg-[#F2EFE9]'
          }`}
        >
          <Palette className="w-3 h-3" />
          <span>Specimen</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#FDFCFB]">
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
