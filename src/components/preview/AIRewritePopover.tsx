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
    'Cut the Yap (Concise)',
    'Corporate Mask (Formal)',
    'Aura Boost (High Impact)',
    'ATS Keyword Magnet'
  ];

  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-88 max-w-sm neo-box p-4 font-sans text-sm no-print animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#141413]">
        <div className="flex items-center gap-1.5 text-[#141413] font-mono text-xs uppercase tracking-wider font-black">
          <Sparkles className="w-3.5 h-3.5 text-[#141413]" />
          <span>{suggestedText ? '02 / AI PROPOSAL' : '01 / REWRITE DIRECTIVE'}</span>
        </div>
        <button onClick={onClose} className="text-[#141413] hover:text-[#FF6B4A] cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {suggestedText ? (
        /* Accept / Decline comparison view */
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#76736C] mb-1 font-bold">Original Record</div>
            <div className="p-2.5 bg-[#F8F7F4] border border-[#141413] text-xs text-[#55534E] max-h-24 overflow-y-auto line-through decoration-[#FF6B4A]">
              {currentValue || '<Empty>'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#141413] mb-1 flex items-center justify-between font-bold">
              <span>Proposed Revision</span>
              <span className="text-[9px] bg-[#D4FF00] text-[#141413] px-1.5 py-0.5 border border-[#141413] font-mono uppercase font-black">Synthesized</span>
            </div>
            <div className="p-2.5 bg-white border-2 border-[#141413] text-xs text-[#141413] max-h-32 overflow-y-auto font-medium shadow-[2px_2px_0px_#141413]">
              {suggestedText}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 neo-btn flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Revision
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 neo-btn flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F2EFE9] text-[#141413] text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSuggestedText(null)}
            className="w-full text-center text-[10px] font-mono uppercase tracking-wider text-[#76736C] hover:text-[#141413] pt-1 flex items-center justify-center gap-1 cursor-pointer font-bold"
          >
            <RotateCcw className="w-3 h-3" />
            Try Alternative Directive
          </button>
        </div>
      ) : (
        /* Prompt input view */
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#76736C] mb-1 font-bold">Target Excerpt</div>
            <div className="p-2 bg-[#F8F7F4] border border-[#141413] text-xs text-[#55534E] max-h-24 overflow-y-auto font-sans">
              {currentValue || 'Empty field'}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleRewrite(sug)}
                disabled={isLoading}
                className="neo-btn px-2 py-1 bg-[#FFFDF8] hover:bg-[#E2D9FC] text-[#141413] text-[11px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
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
              placeholder="Custom directive (e.g. emphasize leadership)..."
              className="w-full pl-2.5 pr-8 py-2 bg-white border-2 border-[#141413] outline-none text-xs text-[#141413] placeholder:text-[#8C887B] font-sans"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={() => handleRewrite()}
              disabled={isLoading || !instruction.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#141413] hover:text-[#FF6B4A] disabled:opacity-30 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
