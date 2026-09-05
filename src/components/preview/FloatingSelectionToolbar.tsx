'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Check, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useResumeStore } from '@/store/resume-store';

export function FloatingSelectionToolbar() {
  const [selectedText, setSelectedText] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const { jobDescription, originalResumeText } = useResumeStore();
  const { addToast } = useToast();

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the active popover, do not close or re-evaluate
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }

      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          if (!isOpen) {
            setCoords(null);
            setSelectedText('');
          }
          return;
        }

        const text = selection.toString().trim();
        // Only trigger if selection is in the resume paper area or main view
        const paper = document.getElementById('resume-paper-element');
        const anchorNode = selection.anchorNode;
        const isInsidePaper = paper && anchorNode && paper.contains(anchorNode);

        if (text.length >= 3 && isInsidePaper) {
          try {
            const range = selection.getRangeAt(0);
            savedRangeRef.current = range.cloneRange();
            const rect = range.getBoundingClientRect();

            // Calculate position above the selected text / mouse
            const pillHeight = 36;
            let top = rect.top - pillHeight - 8;
            if (top < 10) {
              top = rect.bottom + 8; // flip below if off-screen
            }
            const left = Math.max(16, Math.min(rect.left + rect.width / 2 - 100, window.innerWidth - 220));

            setSelectedText(text);
            setCoords({ top, left });
          } catch {
            // Ignore range errors
          }
        }
      }, 50);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setCoords(null);
        setSelectedText('');
        setGeneratedText(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  const handleGenerateText = async (presetPrompt?: string) => {
    const promptToUse = presetPrompt || instruction || 'More impactful and ATS-optimized with strong action verbs';
    if (!selectedText.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/resume/rewrite-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue: selectedText,
          fieldPath: 'selection',
          instruction: promptToUse,
          jobDescription,
          originalResumeText
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate text (HTTP ${res.status})`);
      }

      const data = await res.json();
      const newText = data.rewrittenValue || data.newValue;
      if (newText) {
        setGeneratedText(newText);
        addToast('AI generated text ready for review', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Error generating text', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      addToast('Copied generated text to clipboard!', 'success');
      setIsOpen(false);
      setCoords(null);
    }
  };

  if (!coords || !selectedText) return null;

  return (
    <div 
      ref={popoverRef}
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="fixed z-50 no-print transition-all duration-150"
    >
      {!isOpen ? (
        // Floating action pill right above selection
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-xl border border-white/20 text-xs font-semibold cursor-pointer animate-in fade-in zoom-in-95 hover:scale-105 transition-all select-none group"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 group-hover:rotate-12 transition-transform" />
          <span>✨ Generate / Rewrite Text</span>
        </button>
      ) : (
        // Expanded popover dialog above selection
        <div className="w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-purple-200 p-4 font-sans text-xs text-gray-900 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-purple-700 text-sm">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>AI Text Generator</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Selected Text</span>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 max-h-20 overflow-y-auto text-xs italic">
                "{selectedText}"
              </div>
            </div>

            {generatedText ? (
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Generated Text</span>
                <div className="p-2.5 bg-green-50 border border-green-200 rounded text-gray-900 text-xs font-medium max-h-32 overflow-y-auto">
                  {generatedText}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm text-xs cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy to Clipboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedText(null)}
                    className="py-1.5 px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded text-xs cursor-pointer transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1">
                  {['More impactful', 'More concise', 'ATS optimized', 'Executive tone'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleGenerateText(preset)}
                      className="px-2 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Custom instruction (e.g. emphasize leadership)..."
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateText()}
                    disabled={isLoading}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleGenerateText()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors disabled:bg-purple-400"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Generate</span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
