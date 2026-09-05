'use client';

import React from 'react';
import { RotateCcw, Check, Sparkles, BookmarkCheck } from 'lucide-react';
import { useResumeStore, TemplateSettings } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';

const FONT_OPTIONS: { id: TemplateSettings['fontFamily']; label: string; sample: string; type: string }[] = [
  { id: 'Garamond', label: 'Garamond', sample: 'Devang Srivastava', type: 'Serif (Classic)' },
  { id: 'Times New Roman', label: 'Times New Roman', sample: 'Devang Srivastava', type: 'Serif (Traditional)' },
  { id: 'Georgia', label: 'Georgia', sample: 'Devang Srivastava', type: 'Serif (Warm)' },
  { id: 'Calibri', label: 'Calibri', sample: 'Devang Srivastava', type: 'Sans-Serif (Clean)' },
  { id: 'Arial', label: 'Arial', sample: 'Devang Srivastava', type: 'Sans-Serif (Modern)' },
];

const MARGIN_OPTIONS: { id: TemplateSettings['marginSize']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: '0.35 in (Fit more)' },
  { id: 'normal', label: 'Standard', desc: '0.50 in (Balanced)' },
  { id: 'spacious', label: 'Spacious', desc: '0.75 in (Airy)' },
];

const SPACING_OPTIONS: { id: TemplateSettings['lineSpacing']; label: string; desc: string }[] = [
  { id: 'tight', label: 'Tight', desc: '1.18x (Compact)' },
  { id: 'normal', label: 'Normal', desc: '1.25x (Standard)' },
  { id: 'relaxed', label: 'Relaxed', desc: '1.40x (Airy)' },
];

const FONT_SIZE_OPTIONS: { id: TemplateSettings['fontSize']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: '9.5pt (Dense)' },
  { id: 'standard', label: 'Standard', desc: '10pt (Standard)' },
  { id: 'spacious', label: 'Spacious', desc: '10.5pt (Large)' },
];

const PRESET_COLORS = [
  { color: '#000000', label: 'Charcoal Black' },
  { color: '#1e3a8a', label: 'Navy Blue' },
  { color: '#334155', label: 'Slate Gray' },
  { color: '#065f46', label: 'Emerald' },
  { color: '#831843', label: 'Burgundy' },
  { color: '#581c87', label: 'Deep Indigo' },
];

export function TemplateDesignPanel() {
  const { templateSettings, setTemplateSettings, resetTemplateSettings, resumeData } = useResumeStore();
  const { user, saveProfile, setAuthModalOpen } = useUserStore();
  const { addToast } = useToast();

  return (
    <div className="space-y-6 text-sm">
      {/* Header Info */}
      <div className="bg-purple-50/80 border border-purple-100 rounded-lg p-3 text-xs text-purple-900 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <p>
          Changes update the resume live beside this panel and will be applied to both Web &amp; DOCX exports.
        </p>
      </div>

      {/* Typography */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Typography / Font Family
        </label>
        <div className="space-y-1.5">
          {FONT_OPTIONS.map((f) => {
            const isSelected = templateSettings.fontFamily === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setTemplateSettings({ fontFamily: f.id })}
                className={`w-full text-left p-2.5 rounded-lg border text-sm transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500 font-semibold text-blue-950 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                }`}
              >
                <div>
                  <div className="text-[11px] font-medium text-gray-500">{f.type}</div>
                  <div className="text-sm font-semibold">{f.label}</div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Section Header Accent Color
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          {PRESET_COLORS.map((c) => {
            const isSelected = templateSettings.accentColor.toLowerCase() === c.color.toLowerCase();
            return (
              <button
                key={c.color}
                type="button"
                onClick={() => setTemplateSettings({ accentColor: c.color })}
                title={c.label}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                  isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 border-white shadow-sm' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-gray-200">
            <input
              type="color"
              value={templateSettings.accentColor}
              onChange={(e) => setTemplateSettings({ accentColor: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border border-gray-300 p-0.5"
              title="Custom hex color"
            />
            <span className="text-xs font-mono text-gray-600">{templateSettings.accentColor}</span>
          </div>
        </div>
      </div>

      {/* Margins */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Page Margins
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MARGIN_OPTIONS.map((m) => {
            const isSelected = templateSettings.marginSize === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setTemplateSettings({ marginSize: m.id })}
                className={`text-center p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{m.label}</div>
                <div className="text-[10px] text-gray-500 font-normal">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Line Spacing */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Line Spacing
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SPACING_OPTIONS.map((s) => {
            const isSelected = templateSettings.lineSpacing === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setTemplateSettings({ lineSpacing: s.id })}
                className={`text-center p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="text-[10px] text-gray-500 font-normal">{s.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Scale */}
      <div className="pt-2 border-t border-gray-100">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Font Size Scale
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FONT_SIZE_OPTIONS.map((fs) => {
            const isSelected = templateSettings.fontSize === fs.id;
            return (
              <button
                key={fs.id}
                type="button"
                onClick={() => setTemplateSettings({ fontSize: fs.id })}
                className={`text-center p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{fs.label}</div>
                <div className="text-[10px] text-gray-500 font-normal">{fs.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions: Save to Profile & Reset */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={resetTemplateSettings}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium px-2.5 py-1.5 rounded-md hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
          Reset Defaults
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              setAuthModalOpen(true);
            } else if (resumeData) {
              saveProfile(resumeData, templateSettings);
              addToast('Template preferences and resume saved to your profile!', 'success');
            } else {
              addToast('Template preferences updated!', 'success');
            }
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer"
          title="Save this font, color, margin, and spacing styling to your profile"
        >
          <BookmarkCheck className="w-3.5 h-3.5" />
          <span>Save as My Style</span>
        </button>
      </div>
    </div>
  );
}
