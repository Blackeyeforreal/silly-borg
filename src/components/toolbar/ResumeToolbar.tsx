'use client';

import React, { useState } from 'react';
import { Undo2, Redo2, Download, FileText, Plus, Loader2, FolderPlus } from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/components/ui/Toast';
import { AddSectionModal } from '@/components/preview/AddSectionModal';

export function ResumeToolbar() {
  const { resumeData, reset } = useResumeStore();
  const { undo, redo, pastStates, futureStates } = useResumeStore.temporal.getState();
  const [isExporting, setIsExporting] = useState<'docx' | 'pdf' | null>(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const { addToast } = useToast();

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!resumeData) return;
    setIsExporting(format);

    try {
      const response = await fetch(`/api/resume/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, resume: resumeData })
      });

      if (!response.ok) {
        if (format === 'pdf') {
          // Fallback to browser print which prints the high-fidelity preview
          addToast('Opening print dialog for PDF export...', 'info');
          setTimeout(() => {
            window.print();
          }, 300);
          return;
        }
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      addToast(`Successfully exported ${format.toUpperCase()}`, 'success');
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
    <div className="sticky top-0 z-40 bg-white border-b shadow-sm no-print">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => undo()}
            disabled={pastStates.length === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => redo()}
            disabled={futureStates.length === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAddSectionOpen(true)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 mr-1.5 text-blue-600" />
            Add Section
          </button>

          <button
            onClick={() => handleExport('docx')}
            disabled={!!isExporting}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isExporting === 'docx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export DOCX
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={!!isExporting}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isExporting === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            Export PDF
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to start over? Any unsaved changes will be lost.')) {
                reset();
              }
            }}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Resume
          </button>
        </div>
      </div>

      <AddSectionModal
        isOpen={isAddSectionOpen}
        onClose={() => setIsAddSectionOpen(false)}
      />
    </div>
  );
}
