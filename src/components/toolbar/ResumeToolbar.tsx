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
  LogOut
} from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';
import { AddSectionModal } from '@/components/preview/AddSectionModal';
import { AuthModal } from '@/components/auth/AuthModal';

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
    setSidebarPosition
  } = useResumeStore();
  const { undo, redo, pastStates, futureStates } = useResumeStore.temporal.getState();
  const { user, logout, saveProfile, setAuthModalOpen } = useUserStore();
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const { addToast } = useToast();

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
    <div className="sticky top-0 z-40 bg-white border-b shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1"></div>

          {/* Quick Sidebar Tab Buttons */}
          <button
            onClick={() => setSidebarTab('forms')}
            className={`flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
              isSidebarOpen && sidebarTab === 'forms'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
            }`}
            title="Edit resume sections using side forms"
          >
            <FileEdit className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Edit</span> Forms
          </button>

          <button
            onClick={() => setSidebarTab('rearrange')}
            className={`flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
              isSidebarOpen && sidebarTab === 'rearrange'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
            }`}
            title="Rearrange section order on resume"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            Rearrange
          </button>

          <button
            onClick={() => setSidebarTab('design')}
            className={`flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
              isSidebarOpen && sidebarTab === 'design'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'
            }`}
            title="Customize template font, colors, margins, and spacing side-by-side"
          >
            <Palette className="w-3.5 h-3.5 mr-1" />
            Template
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Dock Position Switcher */}
          <button
            onClick={() => setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors cursor-pointer"
            title={sidebarPosition === 'left' ? 'Dock sidebar to the Right' : 'Dock sidebar to the Left'}
          >
            {sidebarPosition === 'left' ? <PanelRight className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{sidebarPosition === 'left' ? 'Dock Right' : 'Dock Left'}</span>
          </button>

          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Add Section
          </button>

          <div className="w-px h-5 bg-gray-200 mx-0.5"></div>

          <button
            onClick={() => handleExport('docx')}
            disabled={!!isExporting}
            className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isExporting === 'docx' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
            DOCX
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!isExporting}
            className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isExporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            PDF
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to start over? Any unsaved changes will be lost.')) {
                reset();
              }
            }}
            className="flex items-center px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </button>

          <div className="w-px h-5 bg-gray-200 mx-0.5"></div>

          {/* User Account & Save Preferences */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1">
              <button
                onClick={() => {
                  if (resumeData) {
                    saveProfile(resumeData, templateSettings);
                    addToast('Saved current resume & template preferences to your profile!', 'success');
                  }
                }}
                className="flex items-center px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Save current work experience, education, projects, links, and template styling to your account"
              >
                <BookmarkCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span className="hidden sm:inline">Save</span> Profile
              </button>

              <div className="flex items-center gap-1 pl-1 border-l border-gray-200">
                <div 
                  className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs"
                  title={`Logged in as ${user.name} (${user.email})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              title="Log in to save your profile & template preferences"
            >
              <User className="w-3.5 h-3.5 mr-1 text-gray-600" />
              Log In
            </button>
          )}
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
      />

      <AuthModal />
    </div>
  );
}
