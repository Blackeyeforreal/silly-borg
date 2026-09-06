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
          className="neo-btn flex items-center gap-1.5 px-3 py-1.5 bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] font-mono text-xs font-black tracking-wider cursor-pointer animate-in fade-in zoom-in-95 select-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#141413]" />
          <span>⚡ REWRITE / VIBE CHECK</span>
        </button>
      ) : (
        // Expanded popover dialog above selection
        <div className="w-80 sm:w-96 neo-box p-4 font-sans text-xs text-[#141413] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-[#141413]">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-black text-[#141413]">
              <Sparkles className="w-3.5 h-3.5 text-[#141413]" />
              <span>{generatedText ? '02 / AI PROPOSAL' : '01 / REWRITE VIBE'}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#141413] hover:text-[#FF6B4A] p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#76736C] font-bold">Selected Passage</span>
              <div className="mt-1 p-2 bg-[#F8F7F4] border border-[#141413] text-[#55534E] max-h-20 overflow-y-auto text-xs italic font-serif">
                "{selectedText}"
              </div>
            </div>

            {generatedText ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#141413] font-bold">Generated Alternative</span>
                  <span className="text-[9px] bg-[#D4FF00] text-[#141413] px-1.5 py-0.5 border border-[#141413] font-mono uppercase font-black">Synthesized</span>
                </div>
                <div className="p-2.5 bg-white border-2 border-[#141413] text-[#141413] text-xs font-medium max-h-32 overflow-y-auto shadow-[2px_2px_0px_#141413]">
                  {generatedText}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 neo-btn flex items-center justify-center gap-1.5 py-2 px-3 bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] font-mono text-xs uppercase tracking-wider font-bold cursor-pointer transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy to Clipboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedText(null)}
                    className="neo-btn py-2 px-3 bg-white hover:bg-[#F2EFE9] text-[#141413] font-mono text-xs uppercase tracking-wider font-bold cursor-pointer transition-all"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1">
                  {['Cut the Yap', 'Corporate Mask', 'Aura Boost', 'ATS Magnet'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleGenerateText(preset)}
                      className="neo-btn px-2 py-1 bg-[#FFFDF8] hover:bg-[#E2D9FC] text-[#141413] text-[11px] font-mono font-bold cursor-pointer transition-all disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Custom directive (e.g. emphasize leadership)..."
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateText()}
                    disabled={isLoading}
                    className="flex-1 px-2.5 py-1.5 bg-white border-2 border-[#141413] text-xs text-[#141413] outline-none placeholder:text-[#8C887B]"
                  />
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleGenerateText()}
                    className="neo-btn px-3 py-1.5 bg-[#141413] hover:bg-black text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Synthesize</span>
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
