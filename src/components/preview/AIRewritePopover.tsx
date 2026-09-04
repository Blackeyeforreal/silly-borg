'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { Loader2, X, Sparkles, Send, Check, RotateCcw } from 'lucide-react';
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
  const [suggestedText, setSuggestedText] = useState<string | null>(null);
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
        setSuggestedText(newText);
        addToast('AI suggestion ready for review', 'info');
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error rewriting text', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestedText) {
      onRewrite(suggestedText);
      addToast('Change accepted!', 'success');
      onClose();
    }
  };

  const handleDecline = () => {
    setSuggestedText(null);
    addToast('Change declined. Kept original text.', 'info');
  };

  const suggestions = [
    'More concise',
    'More impactful',
    'ATS optimized',
    'More senior'
  ];

  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-88 max-w-sm bg-white rounded-xl shadow-2xl border border-purple-200 p-4 font-sans text-sm no-print animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-purple-700 font-semibold text-sm">
          <Sparkles className="w-4 h-4 mr-1.5 text-purple-600" />
          {suggestedText ? 'Review AI Suggestion' : 'AI Rewrite'}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {suggestedText ? (
        /* Accept / Decline comparison view */
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Original</div>
            <div className="p-2.5 bg-red-50/60 border border-red-200 rounded-md text-xs text-gray-700 max-h-24 overflow-y-auto line-through decoration-red-400">
              {currentValue || '<Empty>'}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>AI Suggestion</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-normal">New</span>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-gray-900 max-h-32 overflow-y-auto font-medium">
              {suggestedText}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-semibold transition-colors cursor-pointer border border-gray-300"
            >
              <X className="w-3.5 h-3.5" />
              Decline
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSuggestedText(null)}
            className="w-full text-center text-[11px] text-purple-600 hover:text-purple-800 hover:underline pt-1 flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Try different instructions
          </button>
        </div>
      ) : (
        /* Prompt input view */
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Current Text</div>
            <div className="p-2 bg-gray-50 rounded border text-xs text-gray-600 max-h-24 overflow-y-auto">
              {currentValue || 'Empty field'}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleRewrite(sug)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-xs transition-colors disabled:opacity-50 cursor-pointer"
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
              className="w-full pl-3 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-xs"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={() => handleRewrite()}
              disabled={isLoading || !instruction.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
