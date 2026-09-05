'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  Copy, 
  Download, 
  Printer, 
  Check, 
  RotateCcw, 
  Plus, 
  Trash2,
  FileSignature,
  Building,
  Briefcase
} from 'lucide-react';
import { useResumeStore } from '@/store/resume-store';
import { useToast } from '@/components/ui/Toast';
import { CoverLetterTone, synthesizeCoverLetterOffline } from '@/lib/cover-letter/synthesizer';

export function CoverLetterModal() {
  const { 
    isCoverLetterOpen, 
    setCoverLetterOpen, 
    coverLetterData, 
    setCoverLetterData, 
    coverLetterTone, 
    setCoverLetterTone,
    resumeData,
    jobDescription,
    templateSettings
  } = useResumeStore();

  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isCoverLetterOpen) return null;

  // Compute typography
  const fontFamilies: Record<string, string> = {
    'Garamond': 'var(--font-serif), "EB Garamond", Garamond, Georgia, serif',
    'Times New Roman': '"Times New Roman", Times, Georgia, serif',
    'Georgia': 'Georgia, Cambria, serif',
    'Calibri': 'Calibri, Candara, "Segoe UI", Arial, sans-serif',
    'Arial': 'Arial, Helvetica, sans-serif',
  };
  const currentFontFamily = fontFamilies[templateSettings?.fontFamily] || fontFamilies['Garamond'];
  const accentColor = templateSettings?.accentColor || '#000000';

  const handleGenerate = async (selectedTone: CoverLetterTone = coverLetterTone) => {
    if (!resumeData) {
      addToast('Please build or import a resume first.', 'error');
      return;
    }
    if (!jobDescription || !jobDescription.trim()) {
      addToast('Please provide a job description so the cover letter can be tailored.', 'error');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          tone: selectedTone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const result = await response.json();
      if (result.coverLetter) {
        setCoverLetterData(result.coverLetter);
        addToast(`Cover letter generated in ${selectedTone} tone!`, 'success');
      }
    } catch (err: any) {
      console.warn('Cover letter API failed, falling back to local synthesizer:', err);
      const fallback = synthesizeCoverLetterOffline(resumeData, jobDescription, selectedTone);
      setCoverLetterData(fallback);
      addToast('Generated cover letter with built-in synthesis engine!', 'info');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetterData || !resumeData) return;

    const candidateName = resumeData.personal_info?.full_name || '';
    const contact = resumeData.personal_info?.contact;
    const contactLine = [
      contact?.email,
      contact?.phone,
      contact?.location,
      contact?.portfolio || contact?.linkedin || contact?.github
    ].filter(Boolean).join(' | ');

    const textParts = [
      candidateName,
      contactLine,
      '',
      coverLetterData.date,
      '',
      coverLetterData.recipient_name,
      coverLetterData.recipient_title,
      coverLetterData.company_name,
      '',
      `Dear ${coverLetterData.recipient_name || 'Hiring Manager'},`,
      '',
      coverLetterData.opening_paragraph,
      '',
      ...(coverLetterData.body_paragraphs || []).map(p => p + '\n'),
      coverLetterData.closing_paragraph,
      '',
      coverLetterData.sign_off || 'Sincerely,',
      candidateName
    ];

    navigator.clipboard.writeText(textParts.join('\n'));
    setCopied(true);
    addToast('Cover letter copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportDocx = async () => {
    if (!coverLetterData || !resumeData) return;

    setIsExportingDocx(true);
    try {
      const response = await fetch('/api/cover-letter/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverLetter: coverLetterData,
          resumeData,
          templateSettings
        })
      });

      if (!response.ok) throw new Error('DOCX export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-letter-${(coverLetterData.company_name || 'application').toLowerCase().replace(/\s+/g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('Successfully exported Cover Letter DOCX', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to export DOCX', 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const updateField = (field: string, value: any) => {
    if (!coverLetterData) return;
    setCoverLetterData({
      ...coverLetterData,
      [field]: value
    });
  };

  const updateBodyParagraph = (index: number, value: string) => {
    if (!coverLetterData) return;
    const newBody = [...coverLetterData.body_paragraphs];
    newBody[index] = value;
    setCoverLetterData({
      ...coverLetterData,
      body_paragraphs: newBody
    });
  };

  const addBodyParagraph = () => {
    if (!coverLetterData) return;
    setCoverLetterData({
      ...coverLetterData,
      body_paragraphs: [
        ...coverLetterData.body_paragraphs,
        'Furthermore, my expertise in delivering reliable software architectures enables me to hit the ground running and contribute immediately to your team objectives.'
      ]
    });
  };

  const removeBodyParagraph = (index: number) => {
    if (!coverLetterData) return;
    const newBody = coverLetterData.body_paragraphs.filter((_, i) => i !== index);
    setCoverLetterData({
      ...coverLetterData,
      body_paragraphs: newBody
    });
  };

  const candidateName = resumeData?.personal_info?.full_name || 'Candidate Name';
  const contact = resumeData?.personal_info?.contact;
  const contactParts = [
    contact?.email,
    contact?.phone,
    contact?.location,
    contact?.portfolio || contact?.linkedin || contact?.github
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80">
        
        {/* Top Header Controls Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
              <FileSignature className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                1-Click Matched Cover Letter
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Tailored directly from your target job description and master experience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tone Selector */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
              {(['professional', 'confident', 'technical'] as CoverLetterTone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setCoverLetterTone(t);
                    if (coverLetterData) {
                      handleGenerate(t);
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                    coverLetterTone === t
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Re-generate button */}
            <button
              type="button"
              onClick={() => handleGenerate(coverLetterTone)}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{coverLetterData ? 'Re-Tailor' : 'Generate'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCoverLetterOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-dot-grid bg-slate-100/70 flex justify-center">
          {!coverLetterData ? (
            <div className="max-w-md my-auto text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
                <FileSignature className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Generate Tailored Cover Letter</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Automatically connects your top career achievements and skills with the target job requirements in an executive letter.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate(coverLetterTone)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer text-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                <span>Generate Cover Letter (1-Click)</span>
              </button>
            </div>
          ) : (
            /* Styled Cover Letter Paper */
            <div 
              className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.14)] ring-1 ring-slate-900/5 rounded-xs p-8 sm:p-12 w-full max-w-[8.5in] text-black transition-all font-serif"
              style={{
                fontFamily: currentFontFamily,
                minHeight: '10.5in',
                fontSize: '10.5pt',
                lineHeight: 1.4
              }}
            >
              {/* Candidate Letterhead matching Resume */}
              <div className="text-center pb-4 mb-6 border-b" style={{ borderBottomColor: accentColor }}>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                  {candidateName}
                </h1>
                {contactParts.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {contactParts.join('   |   ')}
                  </p>
                )}
              </div>

              {/* Date & Recipient Details */}
              <div className="mb-6 space-y-1 font-sans text-xs text-gray-700">
                <div>
                  <input
                    type="text"
                    value={coverLetterData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full bg-transparent hover:bg-gray-50 focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-hidden px-1 py-0.5 font-medium transition-colors"
                    placeholder="Date"
                  />
                </div>

                <div className="pt-3 space-y-1">
                  <input
                    type="text"
                    value={coverLetterData.recipient_name}
                    onChange={(e) => updateField('recipient_name', e.target.value)}
                    className="w-full font-bold text-gray-900 bg-transparent hover:bg-gray-50 focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Hiring Manager / Recipient Name"
                  />
                  <input
                    type="text"
                    value={coverLetterData.recipient_title}
                    onChange={(e) => updateField('recipient_title', e.target.value)}
                    className="w-full text-gray-600 bg-transparent hover:bg-gray-50 focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Title (e.g. Engineering Lead / Hiring Team)"
                  />
                  <input
                    type="text"
                    value={coverLetterData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className="w-full font-semibold text-gray-800 bg-transparent hover:bg-gray-50 focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <p className="font-semibold text-gray-900">
                  Dear {coverLetterData.recipient_name || 'Hiring Manager'},
                </p>
              </div>

              {/* Opening Paragraph */}
              <div className="mb-4 relative group/para">
                <textarea
                  value={coverLetterData.opening_paragraph}
                  onChange={(e) => updateField('opening_paragraph', e.target.value)}
                  rows={3}
                  className="w-full bg-transparent hover:bg-gray-50/70 focus:bg-white p-2 rounded border border-transparent hover:border-gray-200 focus:border-blue-500 outline-hidden resize-y transition-all text-justify leading-relaxed"
                  placeholder="Opening paragraph..."
                />
              </div>

              {/* Body Paragraphs */}
              {coverLetterData.body_paragraphs.map((bodyPara, idx) => (
                <div key={idx} className="mb-4 relative group/bodypara">
                  <textarea
                    value={bodyPara}
                    onChange={(e) => updateBodyParagraph(idx, e.target.value)}
                    rows={4}
                    className="w-full bg-transparent hover:bg-gray-50/70 focus:bg-white p-2 rounded border border-transparent hover:border-gray-200 focus:border-blue-500 outline-hidden resize-y transition-all text-justify leading-relaxed"
                    placeholder={`Body paragraph ${idx + 1}...`}
                  />
                  {coverLetterData.body_paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBodyParagraph(idx)}
                      className="absolute right-1 -top-2 opacity-0 group-hover/bodypara:opacity-100 p-1 bg-white border border-gray-200 rounded-md text-gray-400 hover:text-red-600 shadow-xs transition-opacity cursor-pointer no-print"
                      title="Remove paragraph"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="mb-4 text-center no-print">
                <button
                  type="button"
                  onClick={addBodyParagraph}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-sans font-medium px-2 py-1 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Achievement Paragraph
                </button>
              </div>

              {/* Closing Paragraph */}
              <div className="mb-6 relative group/para">
                <textarea
                  value={coverLetterData.closing_paragraph}
                  onChange={(e) => updateField('closing_paragraph', e.target.value)}
                  rows={2}
                  className="w-full bg-transparent hover:bg-gray-50/70 focus:bg-white p-2 rounded border border-transparent hover:border-gray-200 focus:border-blue-500 outline-hidden resize-y transition-all text-justify leading-relaxed"
                  placeholder="Closing paragraph..."
                />
              </div>

              {/* Sign-off */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={coverLetterData.sign_off}
                  onChange={(e) => updateField('sign_off', e.target.value)}
                  className="bg-transparent hover:bg-gray-50 focus:bg-white border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-hidden px-1 py-0.5 transition-colors font-medium text-gray-900"
                  placeholder="Sincerely,"
                />
                <p className="font-bold text-gray-900 pt-3">
                  {candidateName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        {coverLetterData && (
          <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="text-xs text-gray-500 font-sans flex items-center gap-2">
              <span>💡 Click any paragraph to edit inline</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download DOCX</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
