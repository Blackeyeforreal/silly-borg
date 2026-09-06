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
    <div className="fixed inset-0 z-50 bg-[#141413]/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-[#FDFCFB] neo-box shadow-[6px_6px_0px_#141413] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border-2 border-[#141413]">
        
        {/* Top Header Controls Bar */}
        <div className="px-5 py-3.5 border-b-2 border-[#141413] bg-[#FFFDF8] flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            <span className="sticker-pill bg-[#D4FF00] text-[#141413] text-[10px]">
              01 · MATCHED LETTER
            </span>
            <div>
              <h2 className="font-serif-display text-lg tracking-tight text-[#141413] leading-none">
                Matched Cover Letter
              </h2>
              <p className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider mt-0.5 font-bold">
                Target Requisition Alignment &amp; Experience Synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Gen Z Tone Selector */}
            <div className="flex items-center border-2 border-[#141413] bg-white shadow-[2px_2px_0px_#141413] p-0.5 font-mono text-xs font-bold">
              {[
                { tone: 'professional', label: 'Corporate Mask' },
                { tone: 'confident', label: 'Main Character' },
                { tone: 'technical', label: '10x Builder' }
              ].map(({ tone, label }) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setCoverLetterTone(tone as CoverLetterTone);
                    if (coverLetterData) {
                      handleGenerate(tone as CoverLetterTone);
                    }
                  }}
                  className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
                    coverLetterTone === tone
                      ? 'bg-[#141413] text-white font-bold'
                      : 'text-[#141413] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Re-generate button */}
            <button
              type="button"
              onClick={() => handleGenerate(coverLetterTone)}
              disabled={isGenerating}
              className="neo-btn flex items-center gap-1.5 px-3 py-1.5 bg-[#D4FF00] hover:bg-[#C8F500] text-[#141413] font-mono text-xs uppercase tracking-wider font-bold disabled:opacity-50 transition-all cursor-pointer"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#141413]" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{coverLetterData ? 'Re-Cook' : 'Cook Letter'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCoverLetterOpen(false)}
              className="p-1.5 text-[#141413] hover:text-[#FF6B4A] transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F3F1EC] flex justify-center custom-scrollbar">
          {!coverLetterData ? (
            <div className="max-w-md my-auto text-center p-8 bg-[#FDFCFB] rounded-xs border border-[#E7E4DC] paper-shadow">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-2 py-0.5 rounded-xs font-semibold">
                Publication Pipeline
              </span>
              <h3 className="font-serif-display text-2xl text-[#141413] mt-3 mb-2">Generate Tailored Cover Letter</h3>
              <p className="font-sans text-xs text-[#76736C] mb-6 leading-relaxed">
                Automatically synthesizes your highest-impact achievements and technical competencies to match the specific requisitions in the target job description.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate(coverLetterTone)}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#141413] hover:bg-[#2A2927] text-[#F8F7F4] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#141413] transition-all cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#993322]" />}
                <span>Generate Tailored Letter (1-Click)</span>
              </button>
            </div>
          ) : (
            /* Styled Cover Letter Paper */
            <div 
              className="bg-white shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-1 ring-[#141413]/5 rounded-none p-8 sm:p-12 w-full max-w-[8.5in] text-[#141413] transition-all font-serif"
              style={{
                fontFamily: currentFontFamily,
                minHeight: '10.5in',
                fontSize: '10.5pt',
                lineHeight: 1.45
              }}
            >
              {/* Candidate Letterhead matching Resume */}
              <div className="text-center pb-4 mb-6 border-b" style={{ borderBottomColor: accentColor }}>
                <h1 className="text-2xl font-bold tracking-tight text-[#141413] mb-1">
                  {candidateName}
                </h1>
                {contactParts.length > 0 && (
                  <p className="font-sans text-xs text-[#76736C]">
                    {contactParts.join('   ·   ')}
                  </p>
                )}
              </div>

              {/* Date & Recipient Details */}
              <div className="mb-6 space-y-1 font-sans text-xs text-[#76736C]">
                <div>
                  <input
                    type="text"
                    value={coverLetterData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="w-full bg-transparent hover:bg-[#F8F7F4] focus:bg-white border-b border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden px-1 py-0.5 font-mono text-[11px] transition-colors"
                    placeholder="Date"
                  />
                </div>

                <div className="pt-3 space-y-1">
                  <input
                    type="text"
                    value={coverLetterData.recipient_name}
                    onChange={(e) => updateField('recipient_name', e.target.value)}
                    className="w-full font-bold text-[#141413] bg-transparent hover:bg-[#F8F7F4] focus:bg-white border-b border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Hiring Manager / Recipient Name"
                  />
                  <input
                    type="text"
                    value={coverLetterData.recipient_title}
                    onChange={(e) => updateField('recipient_title', e.target.value)}
                    className="w-full text-[#76736C] bg-transparent hover:bg-[#F8F7F4] focus:bg-white border-b border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Title (e.g. Engineering Lead / Hiring Team)"
                  />
                  <input
                    type="text"
                    value={coverLetterData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    className="w-full font-semibold text-[#141413] bg-transparent hover:bg-[#F8F7F4] focus:bg-white border-b border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden px-1 py-0.5 transition-colors"
                    placeholder="Company Name"
                  />
                </div>
              </div>

              {/* Salutation */}
              <div className="mb-4">
                <p className="font-semibold text-[#141413]">
                  Dear {coverLetterData.recipient_name || 'Hiring Manager'},
                </p>
              </div>

              {/* Opening Paragraph */}
              <div className="mb-4 relative group/para">
                <textarea
                  value={coverLetterData.opening_paragraph}
                  onChange={(e) => updateField('opening_paragraph', e.target.value)}
                  rows={3}
                  className="w-full bg-transparent hover:bg-[#F8F7F4] focus:bg-white p-2 rounded-xs border border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden resize-y transition-all text-justify leading-relaxed text-[#141413]"
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
                    className="w-full bg-transparent hover:bg-[#F8F7F4] focus:bg-white p-2 rounded-xs border border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden resize-y transition-all text-justify leading-relaxed text-[#141413]"
                    placeholder={`Body paragraph ${idx + 1}...`}
                  />
                  {coverLetterData.body_paragraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBodyParagraph(idx)}
                      className="absolute right-1 -top-2 opacity-0 group-hover/bodypara:opacity-100 p-1 bg-white border border-[#DCD8CE] rounded-xs text-[#76736C] hover:text-[#993322] shadow-xs transition-opacity cursor-pointer no-print"
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
                  className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-[#993322] hover:text-[#802B1D] font-semibold px-2 py-1 rounded-xs hover:bg-[#FBF3F1] cursor-pointer transition-colors"
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
                  className="w-full bg-transparent hover:bg-[#F8F7F4] focus:bg-white p-2 rounded-xs border border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden resize-y transition-all text-justify leading-relaxed text-[#141413]"
                  placeholder="Closing paragraph..."
                />
              </div>

              {/* Sign-off */}
              <div className="space-y-1">
                <input
                  type="text"
                  value={coverLetterData.sign_off}
                  onChange={(e) => updateField('sign_off', e.target.value)}
                  className="bg-transparent hover:bg-[#F8F7F4] focus:bg-white border-b border-transparent hover:border-[#DCD8CE] focus:border-[#141413] outline-hidden px-1 py-0.5 transition-colors font-medium text-[#141413]"
                  placeholder="Sincerely,"
                />
                <p className="font-bold text-[#141413] pt-3">
                  {candidateName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        {coverLetterData && (
          <div className="px-5 py-3 border-t-2 border-[#141413] bg-[#FFFDF8] flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider font-bold">
              [ NOTE ] Click any passage to edit inline · Outputs format to matching typography
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="neo-btn flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold text-[#141413] bg-white hover:bg-[#D4FF00] transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#141413]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportDocx}
                disabled={isExportingDocx}
                className="neo-btn flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider font-black text-[#141413] bg-[#D4FF00] hover:bg-[#C8F500] transition-all cursor-pointer disabled:opacity-50"
              >
                {isExportingDocx ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#141413]" /> : <Download className="w-3.5 h-3.5" />}
                <span>Download DOCX</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="neo-btn flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-bold text-[#141413] bg-[#E2D9FC] hover:bg-[#D4C4FC] transition-all cursor-pointer"
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
