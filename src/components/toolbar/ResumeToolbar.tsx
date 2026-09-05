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
  Palette, 
  FileEdit, 
  ArrowUpDown,
  PanelLeft,
  PanelRight,
  BookmarkCheck,
  User,
  LogOut,
  Zap,
  FileSignature,
  Sparkles,
  CheckCircle2,
  AlertTriangle
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
          addToast('Successfully exported PDF', 'success');
          return;
        } catch (pdfErr) {
          console.error('Direct PDF export error, falling back to print dialog:', pdfErr);
          addToast('Direct PDF export encountered an issue. Opening print dialog...', 'info');
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
      
      addToast('Successfully exported DOCX', 'success');
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 overflow-x-auto">
        
        {/* Left: Brand & Undo/Redo & Tabs */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Logo Mark */}
          <div className="flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="hidden xl:inline text-xs font-bold tracking-tight text-slate-900">
              SillyBorg
            </span>
          </div>

          <div className="w-px h-5 bg-slate-200"></div>

          {/* Undo / Redo */}
          <div className="flex items-center space-x-0.5 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => undo()}
              disabled={pastStates.length === 0}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => redo()}
              disabled={futureStates.length === 0}
              className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-5 bg-slate-200"></div>

          {/* Sidebar Tab Segmented Switcher */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => setSidebarTab('forms')}
              className={`flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isSidebarOpen && sidebarTab === 'forms'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Edit sections using side forms"
            >
              <FileEdit className="w-3.5 h-3.5 mr-1 text-blue-600" />
              <span>Forms</span>
            </button>

            <button
              onClick={() => setSidebarTab('rearrange')}
              className={`flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isSidebarOpen && sidebarTab === 'rearrange'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Rearrange section order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Order</span>
            </button>

            <button
              onClick={() => setSidebarTab('design')}
              className={`flex items-center px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                isSidebarOpen && sidebarTab === 'design'
                  ? 'bg-white text-purple-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Customize typography, colors, margins"
            >
              <Palette className="w-3.5 h-3.5 mr-1 text-purple-600" />
              <span>Template</span>
            </button>
          </div>
        </div>

        {/* Right: Page Fit Pill, Cover Letter, Exports, New, User */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* 1-Page Fit Status Indicator / Quick Tuner */}
          {isOverflowing ? (
            <button
              onClick={() => {
                fitToSinglePage();
                addToast('⚡ Auto-Tuned: Compact styling applied to fit 1 page!', 'success');
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 shadow-2xs transition-all cursor-pointer animate-pulse hover:animate-none"
              title="Resume spills onto 2 pages. Click to auto-fit to 1 page."
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{pageFitPercent}% • Fit 1-Page</span>
            </button>
          ) : (
            <div 
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50/80 border border-emerald-200 rounded-lg"
              title="Resume fits cleanly within 1 page"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{pageFitPercent > 0 ? `${pageFitPercent}% • 1 Page` : '1 Page'}</span>
            </div>
          )}

          {/* 1-Click Matched Cover Letter */}
          <button
            onClick={() => setCoverLetterOpen(true)}
            className="flex items-center px-3 py-1.5 text-xs font-bold text-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/90 rounded-lg hover:from-emerald-100 hover:to-teal-100 shadow-2xs transition-all cursor-pointer"
            title="Generate matching tailored cover letter from this job description"
          >
            <FileSignature className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>Cover Letter</span>
          </button>

          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="hidden md:flex items-center px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Add Section
          </button>

          <div className="w-px h-5 bg-slate-200 mx-0.5"></div>

          {/* Export Group */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              onClick={() => handleExport('docx')}
              disabled={!!isExporting}
              className="flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
              title="Download Microsoft Word .docx"
            >
              {isExporting === 'docx' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1 text-blue-600" />}
              <span>DOCX</span>
            </button>
            
            <button
              onClick={() => handleExport('pdf')}
              disabled={!!isExporting}
              className="flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-md hover:bg-white/80 disabled:opacity-50 transition-all cursor-pointer"
              title="Download high-resolution vector PDF"
            >
              {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1 text-red-500" />}
              <span>PDF</span>
            </button>
          </div>

          {/* New / Reset */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to start over? Any unsaved changes will be lost.')) {
                reset();
              }
            }}
            className="flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Start over with a new resume"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New</span>
          </button>

          {/* User Account / Preferences */}
          {user ? (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
              <button
                onClick={() => {
                  if (resumeData) {
                    saveProfile(resumeData, templateSettings);
                    addToast('Saved current resume & template preferences to your profile!', 'success');
                  }
                }}
                className="hidden sm:flex items-center px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Save current resume and style preferences to your account"
              >
                <BookmarkCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Save</span>
              </button>

              <div 
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
                title={`Logged in as ${user.name} (${user.email})`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mr-1 text-slate-600" />
              <span>Log In</span>
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
