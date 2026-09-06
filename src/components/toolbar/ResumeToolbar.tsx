'use client';

import React, { useState } from 'react';
import { 
  Undo2, 
  Redo2, 
  Download, 
  FileText, 
  Plus, 
  Loader2, 
  FolderPlus, 
  Sliders, 
  FileEdit, 
  ArrowUpDown,
  PanelLeft,
  PanelRight,
  BookmarkCheck,
  User,
  LogOut,
  Zap,
  FileSignature
} from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';
import { AddSectionModal } from '@/components/preview/AddSectionModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { CoverLetterModal } from '@/components/cover-letter/CoverLetterModal';

export function ResumeToolbar() {
  const { 
    resumeData, 
    reset, 
    templateSettings,
    sidebarTab,
    setSidebarTab,
    isSidebarOpen,
    toggleSidebar,
    sidebarPosition,
    setSidebarPosition,
    fitToSinglePage,
    setCoverLetterOpen,
    pageFitPercent
  } = useResumeStore();
  const { undo, redo, pastStates, futureStates } = useResumeStore.temporal.getState();
  const { user, logout, saveProfile, setAuthModalOpen } = useUserStore();
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const { addToast } = useToast();

  const isOverflowing = pageFitPercent > 100;

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!resumeData) return;
    setIsExporting(format);

    try {
      if (format === 'pdf') {
        try {
          const { exportResumeToPdf } = await import('@/lib/pdf/exporter');
          await exportResumeToPdf('resume.pdf');
          addToast('Document exported as PDF', 'success');
          return;
        } catch (pdfErr) {
          console.error('Direct PDF export error, falling back to print dialog:', pdfErr);
          addToast('Opening print dialog for PDF export...', 'info');
          setTimeout(() => {
            window.print();
          }, 300);
          return;
        }
      }

      const response = await fetch('/api/resume/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, resume: resumeData, templateSettings })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addToast('Document exported as DOCX', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : `Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  // Setup keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (futureStates.length > 0) redo();
        } else {
          e.preventDefault();
          if (pastStates.length > 0) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (futureStates.length > 0) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, pastStates.length, futureStates.length]);

  return (
    <header className="sticky top-0 z-40 bg-[#FDFCFB] border-b-2 border-[#141413] no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3 overflow-x-auto">
        
        {/* Left: Studio Identity, History, and Tabs */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-wider uppercase font-black text-[#141413]">
              SILLYBORG
            </span>
            <span className="sticker-pill bg-[#D4FF00] text-[#141413] text-[10px] hidden sm:inline-flex">
              ⚡ GEN-Z
            </span>
          </div>

          <div className="w-px h-4 bg-[#141413]" />

          {/* Undo / Redo */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => undo()}
              disabled={pastStates.length === 0}
              className="p-1.5 text-[#141413] hover:bg-[#EFECE6] border border-[#141413] shadow-[1.5px_1.5px_0px_#141413] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => redo()}
              disabled={futureStates.length === 0}
              className="p-1.5 text-[#141413] hover:bg-[#EFECE6] border border-[#141413] shadow-[1.5px_1.5px_0px_#141413] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-[#141413] hidden sm:block" />

          {/* Segmented Palette Tabs */}
          <div className="hidden sm:flex items-center border-2 border-[#141413] bg-white shadow-[2px_2px_0px_#141413] p-0.5 font-mono text-[11px] tracking-wider uppercase font-bold">
            <button
              onClick={() => setSidebarTab('forms')}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors cursor-pointer ${
                isSidebarOpen && sidebarTab === 'forms'
                  ? 'bg-[#141413] text-white'
                  : 'text-[#141413] hover:bg-[#F2EFE9]'
              }`}
            >
              <FileEdit className="w-3 h-3" />
              <span>Content</span>
            </button>

            <button
              onClick={() => setSidebarTab('rearrange')}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors cursor-pointer ${
                isSidebarOpen && sidebarTab === 'rearrange'
                  ? 'bg-[#141413] text-white'
                  : 'text-[#141413] hover:bg-[#F2EFE9]'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Order</span>
            </button>

            <button
              onClick={() => setSidebarTab('design')}
              className={`flex items-center gap-1 px-2.5 py-1 transition-colors cursor-pointer ${
                isSidebarOpen && sidebarTab === 'design'
                  ? 'bg-[#141413] text-white'
                  : 'text-[#141413] hover:bg-[#F2EFE9]'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Typeset</span>
            </button>
          </div>
        </div>

        {/* Right: Page Boundary Status, Cover Letter, Exports, Profile */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Page 1 Boundary Auto-Tuner */}
          {isOverflowing ? (
            <button
              onClick={() => {
                fitToSinglePage();
                addToast('Auto-tuned: Adjusted spacing and font metrics to fit 1 page!', 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase text-[#141413] bg-[#FF6B4A] border-2 border-[#141413] shadow-[2px_2px_0px_#141413] hover:shadow-[3px_3px_0px_#141413] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer animate-pulse"
              title="Resume spills onto page 2! Click to auto-tune into 1 page."
            >
              <Zap className="w-3.5 h-3.5 fill-[#141413] text-[#141413]" />
              <span>🚨 {pageFitPercent}% • COOKED! FIT 1-PAGE</span>
            </button>
          ) : (
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold tracking-wider uppercase text-[#141413] bg-[#D4FF00] border-2 border-[#141413] shadow-[2px_2px_0px_#141413]"
              title="Content fits within single page constraint"
            >
              <span>🔥 {pageFitPercent > 0 ? `${pageFitPercent}%` : '100%'} • VIBE CHECK PASSED</span>
            </div>
          )}

          {/* Cover Letter Companion */}
          <button
            onClick={() => setCoverLetterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wider uppercase text-[#141413] bg-[#E2D9FC] border-2 border-[#141413] shadow-[2px_2px_0px_#141413] hover:shadow-[3px_3px_0px_#141413] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            title="Generate matching cover letter from this job requisition"
          >
            <FileSignature className="w-3.5 h-3.5 text-[#141413]" />
            <span className="hidden sm:inline">Cover Letter</span>
            <span className="sm:hidden">Letter</span>
          </button>

          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-bold tracking-wider uppercase text-[#141413] hover:bg-[#F2EFE9] border-2 border-[#141413] shadow-[2px_2px_0px_#141413] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none bg-white transition-all cursor-pointer"
          >
            <FolderPlus className="w-3 h-3" />
            <span>Section</span>
          </button>

          <div className="w-px h-4 bg-[#141413]" />

          {/* Exports: Tactile Neo-Brutalist Capsule */}
          <div className="flex items-center border-2 border-[#141413] bg-[#141413] shadow-[2.5px_2.5px_0px_#141413] overflow-hidden">
            <button
              onClick={() => handleExport('docx')}
              disabled={!!isExporting}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold tracking-wider uppercase bg-white hover:bg-[#D4FF00] text-[#141413] disabled:opacity-50 transition-colors cursor-pointer border-r-2 border-[#141413]"
              title="Download Microsoft Word .docx"
            >
              {isExporting === 'docx' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              <span>DOCX</span>
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={!!isExporting}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold tracking-wider uppercase bg-white hover:bg-[#FF85B3] text-[#141413] disabled:opacity-50 transition-colors cursor-pointer"
              title="Download print-ready PDF"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              <span>PDF</span>
            </button>
          </div>

          {/* New / Reset */}
          <button
            onClick={() => {
              if (window.confirm('Start over? Current document will be reset.')) {
                reset();
              }
            }}
            className="p-1.5 text-[#141413] hover:bg-[#EFECE6] border border-[#141413] shadow-[1.5px_1.5px_0px_#141413] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer bg-white"
            title="Reset document"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* User Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#E7E4DC]">
              <button
                onClick={() => {
                  if (resumeData) {
                    saveProfile(resumeData, templateSettings);
                    addToast('Saved profile and typographic settings', 'success');
                  }
                }}
                className="p-1.5 text-[#55534E] hover:text-[#141413] hover:bg-[#EFECE6] rounded-xs transition-colors cursor-pointer"
                title="Save master profile"
              >
                <BookmarkCheck className="w-4 h-4 text-[#993322]" />
              </button>

              <div 
                className="w-6 h-6 rounded-xs bg-[#141413] text-[#F8F7F4] flex items-center justify-center font-mono text-[10px] font-bold"
                title={`User: ${user.name}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={logout}
                className="p-1 text-[#76736C] hover:text-[#993322] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="p-1.5 text-[#55534E] hover:text-[#141413] transition-colors cursor-pointer"
              title="Sign in"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
      />

      <AuthModal />
      <CoverLetterModal />
    </header>
  );
}
