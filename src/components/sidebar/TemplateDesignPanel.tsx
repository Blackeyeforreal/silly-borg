'use client';

import React from 'react';
import { RotateCcw, Check, BookmarkCheck, Zap } from 'lucide-react';
import { useResumeStore, TemplateSettings } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';

const FONT_OPTIONS: { id: TemplateSettings['fontFamily']; label: string; sample: string; type: string }[] = [
  { id: 'Garamond', label: 'Garamond', sample: 'Devang Srivastava', type: 'Serif · Classic' },
  { id: 'Times New Roman', label: 'Times New Roman', sample: 'Devang Srivastava', type: 'Serif · Traditional' },
  { id: 'Georgia', label: 'Georgia', sample: 'Devang Srivastava', type: 'Serif · Editorial' },
  { id: 'Calibri', label: 'Calibri', sample: 'Devang Srivastava', type: 'Sans · Swiss Modern' },
  { id: 'Arial', label: 'Arial', sample: 'Devang Srivastava', type: 'Sans · Industrial' },
];

const MARGIN_OPTIONS: { id: TemplateSettings['marginSize']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: '0.35 in' },
  { id: 'normal', label: 'Standard', desc: '0.50 in' },
  { id: 'spacious', label: 'Spacious', desc: '0.75 in' },
];

const SPACING_OPTIONS: { id: TemplateSettings['lineSpacing']; label: string; desc: string }[] = [
  { id: 'tight', label: 'Tight', desc: '1.18x' },
  { id: 'normal', label: 'Normal', desc: '1.25x' },
  { id: 'relaxed', label: 'Relaxed', desc: '1.40x' },
];

const FONT_SIZE_OPTIONS: { id: TemplateSettings['fontSize']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: '9.5 pt' },
  { id: 'standard', label: 'Standard', desc: '10.0 pt' },
  { id: 'spacious', label: 'Spacious', desc: '10.5 pt' },
];

const PRESET_COLORS = [
  { color: '#000000', label: 'Carbon Black' },
  { color: '#993322', label: 'Deep Terracotta' },
  { color: '#1e3a8a', label: 'Navy Indigo' },
  { color: '#2E5A36', label: 'Forest Mineral' },
  { color: '#4B4842', label: 'Warm Slate' },
  { color: '#581c87', label: 'Deep Plum' },
];

export function TemplateDesignPanel() {
  const { 
    templateSettings, 
    setTemplateSettings, 
    resetTemplateSettings, 
    resumeData,
    fitToSinglePage,
    pageFitPercent,
    showPageBoundary,
    togglePageBoundary
  } = useResumeStore();
  const { user, saveProfile, setAuthModalOpen } = useUserStore();
  const { addToast } = useToast();

  const isOverflowing = pageFitPercent > 100;

  const handleFitToPage = () => {
    fitToSinglePage();
    addToast('Auto-Tuned: Compact margins, tighter line spacing & compact font scale applied', 'success');
  };

  return (
    <div className="space-y-6 text-xs text-[#141413]">
      {/* Editorial Note */}
      <div className="bg-[#F8F7F4] border-l-2 border-[#993322] p-3 text-[11px] text-[#76736C] font-mono leading-relaxed">
        <span className="text-[#993322] font-semibold">[ SPECIMEN ]</span> Typeset calibrations reflect synchronously in Web preview, PDF export, and DOCX document structures.
      </div>

      {/* 1-Page Boundary & Density Auto-Tuner */}
      <div className="neo-box p-3.5 space-y-3 bg-[#FFFDF8]">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] font-black uppercase tracking-wider text-[#141413] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#141413]" />
            <span>01 · DENSITY &amp; 1-PAGE VIBE CHECK</span>
          </label>
          <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border font-black ${
            isOverflowing 
              ? 'bg-[#FF6B4A] border-2 border-[#141413] text-[#141413]' 
              : 'bg-[#D4FF00] border-2 border-[#141413] text-[#141413]'
          }`}>
            {pageFitPercent > 0 ? `${pageFitPercent}% Capacity` : '1 Page'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-2 bg-[#EFECE6] border border-[#141413] overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                isOverflowing ? 'bg-[#FF6B4A]' : 'bg-[#D4FF00]'
              }`}
              style={{ width: `${Math.min(pageFitPercent || 85, 100)}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] text-[#76736C] font-bold">
            <span>{isOverflowing ? '▲ Warning: Spilling onto Page 2' : '■ 1-Page Target Met · Zero Spill'}</span>
            <span>8.5 × 11 in</span>
          </div>
        </div>

        {/* Auto-tune Trigger Button */}
        {isOverflowing ? (
          <button
            type="button"
            onClick={handleFitToPage}
            className="w-full neo-btn py-2 px-3 bg-[#FF6B4A] hover:bg-[#FF5530] text-[#141413] font-mono text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse"
          >
            <Zap className="w-3.5 h-3.5 fill-[#141413] text-[#141413]" />
            <span>Auto-Fit 1-Page (Uncooked)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFitToPage}
            className="w-full neo-btn py-2 px-3 bg-[#FFFDF8] hover:bg-[#D4FF00] text-[#141413] font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-[#141413]" />
            <span>Optimal 1-Page Layout Locked</span>
          </button>
        )}
      </div>

      {/* Typography */}
      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
          02 · Typography Specimen
        </label>
        <div className="space-y-1.5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = templateSettings.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setTemplateSettings({ fontFamily: f.id })}
                className={`w-full text-left p-2.5 rounded-xs border text-xs transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#141413] bg-[#F8F7F4] ring-1 ring-[#141413] text-[#141413]'
                    : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                }`}
              >
                <div>
                  <div className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider">{f.type}</div>
                  <div className="font-semibold text-sm text-[#141413]">{f.label}</div>
                </div>
                {isSelected && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#993322] font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-[#993322]" /> Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
          03 · Ink &amp; Accent
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => {
            const isSelected = templateSettings.accentColor.toLowerCase() === c.color.toLowerCase();
            return (
              <button
                key={c.color}
                type="button"
                onClick={() => setTemplateSettings({ accentColor: c.color })}
                title={c.label}
                className={`w-7 h-7 rounded-xs border transition-transform cursor-pointer flex items-center justify-center ${
                  isSelected ? 'scale-105 ring-2 ring-offset-2 ring-[#141413] border-white shadow-xs' : 'border-[#DCD8CE] hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-[#E7E4DC]">
            <input
              type="color"
              value={templateSettings.accentColor}
              onChange={(e) => setTemplateSettings({ accentColor: e.target.value })}
              className="w-7 h-7 rounded-xs cursor-pointer border border-[#DCD8CE] p-0.5 bg-white"
              title="Custom hex color"
            />
            <span className="font-mono text-[11px] text-[#76736C]">{templateSettings.accentColor}</span>
          </div>
        </div>
      </div>

      {/* Margins */}
      <div className="pt-2 border-t border-[#E7E4DC]">
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
          04 · Page Margins
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {MARGIN_OPTIONS.map((m) => {
            const isSelected = templateSettings.marginSize === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTemplateSettings({ marginSize: m.id })}
                className={`text-center p-2 rounded-xs border transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold'
                    : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                }`}
              >
                <div className="font-semibold text-xs">{m.label}</div>
                <div className="text-[10px] opacity-75 font-normal">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Line Spacing */}
      <div className="pt-2 border-t border-[#E7E4DC]">
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
          05 · Line Spacing
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {SPACING_OPTIONS.map((s) => {
            const isSelected = templateSettings.lineSpacing === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setTemplateSettings({ lineSpacing: s.id })}
                className={`text-center p-2 rounded-xs border transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold'
                    : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                }`}
              >
                <div className="font-semibold text-xs">{s.label}</div>
                <div className="text-[10px] opacity-75 font-normal">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Scale */}
      <div className="pt-2 border-t border-[#E7E4DC]">
        <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
          06 · Type Scale
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FONT_SIZE_OPTIONS.map((fs) => {
            const isSelected = templateSettings.fontSize === fs.id;
            return (
              <button
                key={fs.id}
                type="button"
                onClick={() => setTemplateSettings({ fontSize: fs.id })}
                className={`text-center p-2 rounded-xs border transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold'
                    : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                }`}
              >
                <div className="font-semibold text-xs">{fs.label}</div>
                <div className="text-[10px] opacity-75 font-normal">{fs.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions: Save to Profile & Reset */}
      <div className="pt-4 border-t border-[#E7E4DC] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={resetTemplateSettings}
          className="neo-btn flex items-center gap-1.5 font-mono text-xs text-[#141413] bg-white hover:bg-[#F2EFE9] px-3 py-1.5 transition-all cursor-pointer uppercase tracking-wider font-bold"
        >
          <RotateCcw className="w-3 h-3 text-[#141413]" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else if (resumeData) {
              saveProfile(resumeData, templateSettings);
              addToast('Template preferences and resume saved to profile', 'success');
            } else {
              addToast('Template preferences updated', 'success');
            }
          }}
          className="neo-btn flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-bold px-3 py-1.5 bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] transition-all cursor-pointer"
          title="Save this font, color, margin, and spacing styling to your profile"
        >
          <BookmarkCheck className="w-3.5 h-3.5 text-[#141413]" />
          <span>Save Specimen</span>
        </button>
      </div>
    </div>
  );
}
