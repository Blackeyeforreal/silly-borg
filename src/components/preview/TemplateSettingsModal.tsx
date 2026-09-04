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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Customize Template</h2>
              <p className="text-xs text-gray-500">Fine-tune styling for both Web Preview and DOCX export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Font Family */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Typography / Font Family
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => {
                const isSelected = templateSettings.fontFamily === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTemplateSettings({ fontFamily: f.id })}
                    className={`text-left p-2.5 rounded-lg border text-sm transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500 font-semibold text-blue-950' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-gray-500">{f.type}</div>
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
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_COLORS.map((c) => {
                const isSelected = templateSettings.accentColor.toLowerCase() === c.color.toLowerCase();
                return (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setTemplateSettings({ accentColor: c.color })}
                    title={c.label}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 border-white shadow-md' : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
              
              {/* Custom Color Input */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                <input
                  type="color"
                  value={templateSettings.accentColor}
                  onChange={(e) => setTemplateSettings({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300 p-0.5"
                  title="Custom hex color"
                />
                <span className="text-xs font-mono text-gray-600">{templateSettings.accentColor}</span>
              </div>
            </div>
          </div>

          {/* Margins & Sizing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            {/* Margins */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Margins
              </label>
              <div className="space-y-1.5">
                {MARGIN_OPTIONS.map((m) => {
                  const isSelected = templateSettings.marginSize === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTemplateSettings({ marginSize: m.id })}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>{m.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Line Spacing
              </label>
              <div className="space-y-1.5">
                {SPACING_OPTIONS.map((s) => {
                  const isSelected = templateSettings.lineSpacing === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTemplateSettings({ lineSpacing: s.id })}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Font Scale
              </label>
              <div className="space-y-1.5">
                {FONT_SIZE_OPTIONS.map((fs) => {
                  const isSelected = templateSettings.fontSize === fs.id;
                  return (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => setTemplateSettings({ fontSize: fs.id })}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/70 font-semibold text-blue-900' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>{fs.label}</div>
                      <div className="text-[10px] text-gray-500 font-normal">{fs.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={resetTemplateSettings}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
