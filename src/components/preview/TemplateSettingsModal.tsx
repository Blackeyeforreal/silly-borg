'use client';

import React from 'react';
import { X, RotateCcw, Check, Palette } from 'lucide-react';
import { useResumeStore, DEFAULT_TEMPLATE_SETTINGS, TemplateSettings } from '@/store/resume-store';

interface TemplateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS: { id: TemplateSettings['fontFamily']; label: string; sample: string; type: string }[] = [
  { id: 'Garamond', label: 'Garamond', sample: 'Devang Srivastava', type: 'Serif (Classic)' },
  { id: 'Times New Roman', label: 'Times New Roman', sample: 'Devang Srivastava', type: 'Serif (Traditional)' },
  { id: 'Georgia', label: 'Georgia', sample: 'Devang Srivastava', type: 'Serif (Warm)' },
  { id: 'Calibri', label: 'Calibri', sample: 'Devang Srivastava', type: 'Sans-Serif (Clean)' },
  { id: 'Arial', label: 'Arial', sample: 'Devang Srivastava', type: 'Sans-Serif (Modern)' },
];

const MARGIN_OPTIONS: { id: TemplateSettings['marginSize']; label: string; desc: string }[] = [
  { id: 'compact', label: 'Compact', desc: '0.35 in (Fit more content)' },
  { id: 'normal', label: 'Standard', desc: '0.50 in (Recommended)' },
  { id: 'spacious', label: 'Spacious', desc: '0.75 in (Airy & relaxed)' },
];

const SPACING_OPTIONS: { id: TemplateSettings['lineSpacing']; label: string; desc: string }[] = [
  { id: 'tight', label: 'Tight', desc: 'Compact line height' },
  { id: 'normal', label: 'Normal', desc: 'Balanced 1.25x' },
  { id: 'relaxed', label: 'Relaxed', desc: 'Generous 1.4x' },
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

export function TemplateSettingsModal({ isOpen, onClose }: TemplateSettingsModalProps) {
  const { templateSettings, setTemplateSettings, resetTemplateSettings } = useResumeStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div 
        className="bg-[#FDFCFB] rounded-xs shadow-2xl border border-[#E7E4DC] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E7E4DC] bg-[#F8F7F4]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs">
              01 · SPECIMEN
            </span>
            <div>
              <h2 className="font-serif-display text-lg text-[#141413] leading-none">Customize Template</h2>
              <p className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider mt-0.5">Calibrate Web Preview &amp; DOCX exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#76736C] hover:text-[#141413] p-1.5 rounded-xs hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Font Family */}
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
              01 · Typography Specimen
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = templateSettings.fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTemplateSettings({ fontFamily: f.id })}
                    className={`text-left p-2.5 rounded-xs border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'border-[#141413] bg-[#F8F7F4] ring-1 ring-[#141413] text-[#141413]' 
                        : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider">{f.type}</div>
                      <div className="font-semibold text-xs text-[#141413]">{f.label}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#993322] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
              02 · Section Header Accent Color
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
                    className={`w-7 h-7 rounded-xs border transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-105 ring-2 ring-offset-2 ring-[#141413] border-white shadow-xs' : 'border-[#DCD8CE] hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
              
              {/* Custom Color Input */}
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[#E7E4DC]">
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

          {/* Margins & Sizing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E7E4DC]">
            {/* Margins */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
                03 · Margins
              </label>
              <div className="space-y-1.5">
                {MARGIN_OPTIONS.map((m) => {
                  const isSelected = templateSettings.marginSize === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTemplateSettings({ marginSize: m.id })}
                      className={`w-full text-left p-2 rounded-xs border font-mono text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold' 
                          : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                      }`}
                    >
                      <div>{m.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
                04 · Line Spacing
              </label>
              <div className="space-y-1.5">
                {SPACING_OPTIONS.map((s) => {
                  const isSelected = templateSettings.lineSpacing === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTemplateSettings({ lineSpacing: s.id })}
                      className={`w-full text-left p-2 rounded-xs border font-mono text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold' 
                          : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-[#141413] mb-2">
                05 · Font Scale
              </label>
              <div className="space-y-1.5">
                {FONT_SIZE_OPTIONS.map((fs) => {
                  const isSelected = templateSettings.fontSize === fs.id;
                  return (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setTemplateSettings({ fontSize: fs.id })}
                      className={`w-full text-left p-2 rounded-xs border font-mono text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-[#141413] bg-[#141413] text-[#F8F7F4] font-semibold' 
                          : 'border-[#E7E4DC] hover:border-[#141413] bg-white text-[#76736C] hover:text-[#141413]'
                      }`}
                    >
                      <div>{fs.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{fs.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F8F7F4] border-t border-[#E7E4DC] flex items-center justify-between">
          <button
            type="button"
            onClick={resetTemplateSettings}
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#76736C] hover:text-[#141413] px-2.5 py-1.5 rounded-xs hover:bg-[#EFECE6] border border-[#DCD8CE] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#76736C]" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#141413] hover:bg-[#2A2927] text-[#F8F7F4] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#141413] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
