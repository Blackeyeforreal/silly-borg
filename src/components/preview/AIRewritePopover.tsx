'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { Loader2, X, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface AIRewritePopoverProps {
  currentValue: string;
  fieldPath: string;
  onRewrite: (newValue: string) => void;
  onClose: () => void;
}

export function AIRewritePopover({
  currentValue,
  fieldPath,
  onRewrite,
  onClose
}: AIRewritePopoverProps) {
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { jobDescription, originalResumeText } = useResumeStore();
  const { addToast } = useToast();

  const handleRewrite = async (presetInstruction?: string) => {
    const promptToUse = presetInstruction || instruction;
    if (!promptToUse.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/resume/rewrite-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue,
          fieldPath,
          instruction: promptToUse,
          jobDescription,
          originalResumeText
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to rewrite text (HTTP ${res.status})`);
      }
      
      const data = await res.json();
      const newText = data.rewrittenValue || data.newValue;
      if (newText) {
        onRewrite(newText);
        addToast('Text rewritten successfully!', 'success');
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error rewriting text', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    'More concise',
    'More impactful',
    'ATS optimized',
    'More senior'
  ];

  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-80 bg-white rounded-lg shadow-xl border border-purple-100 p-4 font-sans text-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-purple-700 font-semibold">
          <Sparkles className="w-4 h-4 mr-1.5" />
          AI Rewrite
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3 p-2 bg-gray-50 rounded border text-xs text-gray-600 max-h-24 overflow-y-auto">
        {currentValue || 'Empty field'}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => handleRewrite(sug)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-xs transition-colors disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRewrite()}
            placeholder="Or type custom instruction..."
            className="w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
            disabled={isLoading}
          />
          <button
            onClick={() => handleRewrite()}
            disabled={isLoading || !instruction.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
