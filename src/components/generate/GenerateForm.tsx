'use client';

import React, { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore, formatResumeDataToText } from '@/store/user-store';
import { parseResumeTextToData } from '@/lib/format-resume';
import { FileUpload } from './FileUpload';
import { ProfileEditorForm } from './ProfileEditorForm';
import { useToast } from '@/components/ui/Toast';
import { 
  Loader2, 
  Check, 
  User, 
  FileEdit, 
  ArrowRight,
  UploadCloud,
  FileText,
  Briefcase
} from 'lucide-react';
import { sampleResumeData } from '@/lib/sample-data';
import type { ResumeData } from '@/lib/schema';

const EDITORIAL_GENERATION_STEPS = [
  'Indexing target requirements & technical stack...',
  'Extracting core competencies & impact metrics...',
  'Synthesizing achievement bullets with XYZ structure...',
  'Aligning terminology for ATS evaluation...',
  'Typesetting single-page editorial layout...',
  'Finalizing career document...'
];

const SAMPLE_JOBS = [
  {
    title: 'Founding Engineer',
    company: 'YC STARTUP',
    description: `Company: YC AI Startup
Role: Founding Full-Stack Engineer
Location: San Francisco, CA / Remote

About the Role:
We are seeking a Founding Full-Stack Engineer to architect and scale mission-critical web applications. You will work across modern frontend frameworks (Next.js, React, TypeScript, Tailwind CSS) and robust backend distributed systems (Node.js, PostgreSQL, Redis, Docker).

Responsibilities:
• Architect performant, accessible, and responsive user interfaces with sub-second latency.
• Build scalable microservices and REST/GraphQL APIs handling high concurrency.
• Collaborate directly with founders to rapidly ship high-impact features.
• Champion engineering excellence, automated testing, and CI/CD pipelines.`
  },
  {
    title: 'Distributed Systems Hacker',
    company: 'DATADOG',
    description: `Company: Datadog
Role: Staff Distributed Systems Hacker
Location: New York, NY / Remote

About the Role:
Looking for an Infrastructure Architect to lead our global ledger, telemetry, and distributed consensus tier.

Requirements:
• 6+ years building high-throughput distributed systems in Go, Rust, or C++.
• Deep expertise with Kubernetes, Docker, Kafka, ClickHouse, and PostgreSQL.
• Track record optimizing system bottlenecks, reducing latency, and achieving 99.999% SLA.
• Experience mentoring senior engineers and driving technical architecture roadmaps.`
  },
  {
    title: 'Lead Frontend Specialist',
    company: 'LINEAR',
    description: `Company: Linear
Role: Lead Frontend Specialist
Location: Remote

About the Role:
We are looking for a craft-obsessed Lead Frontend Specialist to drive UI architecture, design systems, and web performance.

Requirements:
• Mastery of React, Next.js, TypeScript, modern CSS architectures, and micro-interactions.
• Proven expertise optimizing Core Web Vitals (LCP, INP, CLS) and state synchronization.
• Keen eye for typography, layout design, and fluid transitions.`
  }
];

export function GenerateForm() {
  const [inputMode, setInputMode] = useState<'upload' | 'paste' | 'form'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [structuredProfile, setStructuredProfile] = useState<ResumeData | null>(null);
  const [isParsingText, setIsParsingText] = useState(false);
  
  const { user, savedProfile, setAuthModalOpen } = useUserStore();
  const [useSavedProfile, setUseSavedProfile] = useState(false);

  // Sync useSavedProfile default when user and savedProfile are available
  useEffect(() => {
    if (user && savedProfile?.resumeData) {
      setUseSavedProfile(true);
    }
  }, [user, savedProfile]);

  const { 
    jobDescription, 
    setJobDescription, 
    setOriginalResumeText, 
    isGenerating, 
    setIsGenerating,
    setGenerationStep,
    setResumeData,
    setTemplateSettings,
    generationStep
  } = useResumeStore();

  // Step cycling during generation
  useEffect(() => {
    if (!isGenerating) return;

    let index = 0;
    setGenerationStep(EDITORIAL_GENERATION_STEPS[0]);

    const timer = setInterval(() => {
      index = (index + 1) % EDITORIAL_GENERATION_STEPS.length;
      setGenerationStep(EDITORIAL_GENERATION_STEPS[index]);
    }, 2200);

    return () => clearInterval(timer);
  }, [isGenerating, setGenerationStep]);
  
  const { addToast } = useToast();

  const handleGenerate = async () => {
    const isUsingProfile = useSavedProfile && savedProfile?.resumeData;
    let effectiveResumeText = '';

    if (isUsingProfile) {
      effectiveResumeText = formatResumeDataToText(savedProfile.resumeData);
    } else if (inputMode === 'form' && structuredProfile) {
      effectiveResumeText = formatResumeDataToText(structuredProfile);
    } else {
      effectiveResumeText = resumeText;
    }

    if (!effectiveResumeText.trim()) {
      addToast('Please provide your resume content or load a profile specimen.', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Please enter a target job description or select a preset.', 'error');
      return;
    }

    setOriginalResumeText(effectiveResumeText);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeText: effectiveResumeText,
          originalResumeText: effectiveResumeText,
          jobDescription
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate resume (HTTP ${response.status})`);
      }

      setGenerationStep('Applying typographic hierarchy...');
      
      const data = await response.json();
      if (data.resume) {
        setResumeData(data.resume);
        if (isUsingProfile && savedProfile?.templateSettings) {
          setTemplateSettings(savedProfile.templateSettings);
        }
        addToast('Document tailored and typeset successfully.', 'success');
      } else {
        throw new Error('Invalid response payload');
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error generating resume', 'error');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleLoadSampleResume = () => {
    setStructuredProfile(sampleResumeData);
    setResumeText(formatResumeDataToText(sampleResumeData));
    setInputMode('form');
    addToast('Loaded master specimen profile. Select a target role below.', 'info');
  };

  return (
    <div className="bg-white border border-[#E7E4DC] p-6 sm:p-10 space-y-8">
      {/* Account / Master Profile Banner */}
      {user ? (
        <div className="p-4 border border-[#E7E4DC] bg-[#F8F7F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#76736C]">
              USER SESSION
            </div>
            <div className="text-xs font-semibold text-[#141413]">
              {user.name} <span className="font-normal text-[#76736C]">({user.email})</span>
            </div>
            {savedProfile?.resumeData && (
              <div className="font-mono text-[10px] text-[#993322] mt-0.5">
                • Master profile loaded ({savedProfile.resumeData.work_experience?.length || 0} roles, {savedProfile.resumeData.education?.length || 0} credentials)
              </div>
            )}
          </div>

          {savedProfile?.resumeData && (
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-[#E7E4DC] shrink-0 font-mono text-xs text-[#141413]">
              <input
                type="checkbox"
                checked={useSavedProfile}
                onChange={(e) => setUseSavedProfile(e.target.checked)}
                className="w-3.5 h-3.5 text-[#141413] rounded-xs cursor-pointer"
              />
              <span>Use Master Profile</span>
            </label>
          )}
        </div>
      ) : (
        <div className="p-3 border border-[#E7E4DC] bg-[#F8F7F4] flex items-center justify-between gap-2 text-xs text-[#55534E]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#76736C]">[ PROFILE ]</span>
            <span>Sign in to store master work experience and typographic settings across sessions.</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="font-mono text-[11px] tracking-wider uppercase text-[#141413] hover:text-[#993322] font-semibold underline cursor-pointer shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Section 01: Resume Input */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-[#141413]">
          <div className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-[#141413] font-black">
            <span className="bg-[#D4FF00] px-1.5 py-0.5 border border-[#141413]">01</span>
            <span>/</span>
            <span>DUMP YOUR RESUME</span>
          </div>
          
          {(!useSavedProfile || !savedProfile?.resumeData) && (
            <div className="flex items-center gap-2">
              <div className="flex border-2 border-[#141413] bg-white shadow-[2px_2px_0px_#141413] p-0.5 font-mono text-[11px] tracking-wider uppercase font-bold">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer ${
                    inputMode === 'upload' 
                      ? 'bg-[#141413] text-white' 
                      : 'text-[#141413] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <UploadCloud className="w-3 h-3" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!structuredProfile && resumeText.trim()) {
                      setStructuredProfile(parseResumeTextToData(resumeText));
                    }
                    setInputMode('form');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer ${
                    inputMode === 'form' 
                      ? 'bg-[#141413] text-white' 
                      : 'text-[#141413] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <FileEdit className="w-3 h-3" />
                  <span>Sections</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (structuredProfile && !resumeText.trim()) {
                      setResumeText(formatResumeDataToText(structuredProfile));
                    }
                    setInputMode('paste');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer ${
                    inputMode === 'paste' 
                      ? 'bg-[#141413] text-white' 
                      : 'text-[#141413] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Text</span>
                </button>
              </div>

              {!resumeText.trim() && !structuredProfile && (
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="neo-btn px-2.5 py-1 bg-[#FFFDF8] hover:bg-[#D4FF00] font-mono text-[10px] tracking-wider uppercase text-[#141413] font-bold transition-all cursor-pointer"
                >
                  Load Sample
                </button>
              )}
            </div>
          )}
        </div>

        {useSavedProfile && savedProfile?.resumeData ? (
          <div className="p-4 border border-[#E7E4DC] bg-[#F8F7F4] space-y-2 font-mono text-xs text-[#141413]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#993322]" />
                <span className="font-bold">
                  MASTER PROFILE: {savedProfile.resumeData.personal_info.full_name || user?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseSavedProfile(false)}
                className="text-[#76736C] hover:text-[#141413] underline cursor-pointer"
              >
                Use other source
              </button>
            </div>
            <div className="text-[11px] text-[#55534E] space-y-0.5">
              <p>• Contact: {savedProfile.resumeData.personal_info.contact.email} | {savedProfile.resumeData.personal_info.contact.phone}</p>
              <p>• Work Experience: {savedProfile.resumeData.work_experience?.map(w => w.company).join(', ') || 'None'}</p>
              <p>• Education: {savedProfile.resumeData.education?.map(e => e.university).join(', ') || 'None'}</p>
            </div>
          </div>
        ) : (
          <>
            {inputMode === 'upload' && (
              <FileUpload 
                onParsed={(parsed, rawText) => {
                  setStructuredProfile(parsed);
                  setResumeText(rawText);
                  setInputMode('form');
                }}
                onTextExtracted={(text) => {
                  setResumeText(text);
                }} 
              />
            )}

            {inputMode === 'form' && (
              <ProfileEditorForm
                data={structuredProfile || parseResumeTextToData(resumeText)}
                onChange={(updated) => {
                  setStructuredProfile(updated);
                  setResumeText(formatResumeDataToText(updated));
                }}
                onSwitchToRawText={() => {
                  if (structuredProfile) {
                    setResumeText(formatResumeDataToText(structuredProfile));
                  }
                  setInputMode('paste');
                }}
              />
            )}

            {inputMode === 'paste' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#76736C] font-mono">
                  <span>RAW RESUME TEXT INPUT:</span>
                  {resumeText.trim() && (
                    <button
                      type="button"
                      disabled={isParsingText}
                      onClick={async () => {
                        setIsParsingText(true);
                        try {
                          const res = await fetch('/api/resume/parse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text: resumeText })
                          });
                          if (res.ok) {
                            const parsedJson = await res.json();
                            if (parsedJson.resume) {
                              setStructuredProfile(parsedJson.resume);
                              setInputMode('form');
                              addToast('Parsed into structured sections', 'success');
                              return;
                            }
                          }
                        } catch (e) {
                          console.warn('NLP parse error:', e);
                        } finally {
                          setIsParsingText(false);
                        }
                        setStructuredProfile(parseResumeTextToData(resumeText));
                        setInputMode('form');
                        addToast('Parsed into structured sections via local NLP', 'info');
                      }}
                      className="text-[#141413] hover:text-[#993322] font-semibold cursor-pointer underline disabled:opacity-50"
                    >
                      {isParsingText ? 'Parsing structure...' : 'Parse into Form Sections →'}
                    </button>
                  )}
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setStructuredProfile(parseResumeTextToData(e.target.value));
                  }}
                  placeholder="Paste existing resume text here..."
                  className="w-full h-44 p-4 border border-[#E7E4DC] bg-[#F8F7F4] focus:bg-white focus:border-[#141413] outline-hidden resize-y font-mono text-xs text-[#141413] leading-relaxed transition-colors"
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Section 02: Job Description Input */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-[#141413]">
          <div className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-[#141413] font-black">
            <span className="bg-[#E2D9FC] px-1.5 py-0.5 border border-[#141413]">02</span>
            <span>/</span>
            <span>TARGET GIG / REQUISITION</span>
          </div>
          <span className="font-mono text-[11px] font-bold text-[#76736C]">{jobDescription.length} CHARS</span>
        </div>

        {/* Preset Job Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] tracking-wider uppercase text-[#141413] font-bold">HOT GIG PRESETS:</span>
          {SAMPLE_JOBS.map((job) => (
            <button
              key={job.title}
              type="button"
              onClick={() => {
                setJobDescription(job.description);
                addToast(`Loaded ${job.title} requisition`, 'info');
              }}
              className="neo-btn font-mono text-[11px] tracking-wider uppercase text-[#141413] bg-white hover:bg-[#D4FF00] px-2.5 py-1 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="bg-[#141413] text-white px-1 text-[9px]">[{job.company}]</span>
              <span>{job.title}</span>
            </button>
          ))}
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the target job description or click one of the hot gig presets above..."
          className="w-full h-44 p-4 border-2 border-[#141413] bg-[#FFFDF8] focus:bg-white outline-hidden resize-y text-xs sm:text-sm text-[#141413] leading-relaxed transition-colors font-sans"
        />
      </section>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating || 
            (!resumeText.trim() && !structuredProfile && (!useSavedProfile || !savedProfile?.resumeData)) || 
            !jobDescription.trim()
          }
          className="flex-1 neo-btn flex items-center justify-center min-h-[52px] py-3.5 px-6 font-mono text-sm tracking-wider uppercase font-black text-[#141413] bg-[#D4FF00] hover:bg-[#C8F500] disabled:bg-[#E5E2DA] disabled:text-[#A39F97] disabled:shadow-none disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-[#141413]" />
              <span className="tracking-wider">
                {generationStep || 'Cooking your resume...'}
              </span>
            </div>
          ) : (
            <span>⚡ Cook Resume (Zero Yap) →</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setResumeData(sampleResumeData);
            addToast('Loaded specimen document in workspace', 'info');
          }}
          disabled={isGenerating}
          className="neo-btn flex items-center justify-center py-3.5 px-5 bg-white hover:bg-[#E2D9FC] font-mono text-xs tracking-wider uppercase font-bold text-[#141413] transition-all cursor-pointer"
        >
          Live Studio Canvas →
        </button>
      </div>
    </div>
  );
}
