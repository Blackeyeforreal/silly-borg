'use client';

import React, { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore, formatResumeDataToText } from '@/store/user-store';
import { parseResumeTextToData } from '@/lib/format-resume';
import { FileUpload } from './FileUpload';
import { ProfileEditorForm } from './ProfileEditorForm';
import { useToast } from '@/components/ui/Toast';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  User, 
  FileEdit, 
  Briefcase, 
  ArrowRight,
  UploadCloud,
  FileText,
  Wand2
} from 'lucide-react';
import { sampleResumeData } from '@/lib/sample-data';
import type { ResumeData } from '@/lib/schema';

const DYNAMIC_GENERATION_STEPS = [
  'Analyzing target job requirements & tech stack...',
  'Matching core competencies & achievements...',
  'Highlighting high-impact quantifiable metrics...',
  'Aligning resume keywords for ATS scoring...',
  'Drafting role-tailored bullet points...',
  'Formatting clean executive layout...',
  'Finalizing tailored resume document...'
];

const SAMPLE_JOBS = [
  {
    title: 'Senior Full-Stack Engineer',
    badge: 'Next.js & TS',
    description: `Company: Stripe / Vercel
Role: Senior Full-Stack Engineer
Location: San Francisco, CA / Remote

About the Role:
We are seeking a Senior Full-Stack Engineer to architect and scale mission-critical web applications. You will work across modern frontend frameworks (Next.js, React, TypeScript, Tailwind CSS) and robust backend distributed systems (Node.js, PostgreSQL, Redis, Docker).

Responsibilities:
• Architect performant, accessible, and responsive user interfaces with sub-second latency.
• Build scalable microservices and REST/GraphQL APIs handling high concurrency.
• Collaborate with product managers and designers to rapidly ship high-impact features.
• Champion engineering excellence, automated testing, and CI/CD pipelines.`
  },
  {
    title: 'Staff Systems Architect',
    badge: 'Go & K8s',
    description: `Company: Datadog / CloudScale
Role: Staff Distributed Systems Architect
Location: New York, NY / Remote

About the Role:
Looking for a Staff Infrastructure Architect to lead our global ledger, telemetry, and distributed consensus tier.

Requirements:
• 6+ years building high-throughput distributed systems in Go, Rust, or C++.
• Deep expertise with Kubernetes, Docker, Kafka, ClickHouse, and PostgreSQL.
• Track record optimizing system bottlenecks, reducing latency, and achieving 99.999% SLA.
• Experience mentoring senior engineers and driving technical architecture roadmaps.`
  },
  {
    title: 'Lead Frontend Specialist',
    badge: 'React & UI',
    description: `Company: Linear / Figma
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

  // Dynamic engaging loading status cycling
  useEffect(() => {
    if (!isGenerating) return;

    let index = 0;
    setGenerationStep(DYNAMIC_GENERATION_STEPS[0]);

    const timer = setInterval(() => {
      index = (index + 1) % DYNAMIC_GENERATION_STEPS.length;
      setGenerationStep(DYNAMIC_GENERATION_STEPS[index]);
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
      addToast('Please provide your resume content or use your saved profile.', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Please provide a job description.', 'error');
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

      setGenerationStep('Formatting resume data...');
      
      const data = await response.json();
      if (data.resume) {
        setResumeData(data.resume);
        // Automatically restore user's saved template preferences if available
        if (isUsingProfile && savedProfile?.templateSettings) {
          setTemplateSettings(savedProfile.templateSettings);
        }
        addToast(
          isUsingProfile 
            ? 'Resume generated from your saved profile and template preferences!' 
            : 'Resume generated successfully!', 
          'success'
        );
      } else {
        throw new Error('Invalid response format');
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
    addToast('Loaded sample profile! Select a job description below to tailor.', 'info');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 space-y-8 backdrop-blur-md">
      {/* Logged in User Banner */}
      {user ? (
        <div className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Welcome back, {user.name} <span className="text-slate-500 font-normal">({user.email})</span>
              </div>
              {savedProfile?.resumeData ? (
                <div className="text-[11px] text-blue-700 font-medium">
                  Master profile active ({savedProfile.resumeData.work_experience?.length || 0} companies, {savedProfile.resumeData.education?.length || 0} degrees).
                </div>
              ) : (
                <div className="text-[11px] text-amber-700">
                  No saved profile yet. Generate once and click "Save Profile" to keep your history.
                </div>
              )}
            </div>
          </div>

          {savedProfile?.resumeData && (
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs shrink-0 hover:border-blue-300 transition-colors">
              <input
                type="checkbox"
                checked={useSavedProfile}
                onChange={(e) => setUseSavedProfile(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-semibold text-blue-950">Use Saved Profile</span>
            </label>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-200/70 rounded-md text-slate-600">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>Have an account? Log in to save your master work experience and template styling.</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded hover:bg-blue-50 border border-blue-200/80 bg-white transition-colors cursor-pointer shrink-0"
          >
            Log In
          </button>
        </div>
      )}

      {/* Step 1: Resume Input Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-base font-bold text-slate-900">Your Current Resume</h2>
          </div>
          
          {(!useSavedProfile || !savedProfile?.resumeData) && (
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    inputMode === 'upload' 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!structuredProfile && resumeText.trim()) {
                      setStructuredProfile(parseResumeTextToData(resumeText));
                    }
                    setInputMode('form');
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    inputMode === 'form' 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Structured Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (structuredProfile && !resumeText.trim()) {
                      setResumeText(formatResumeDataToText(structuredProfile));
                    }
                    setInputMode('paste');
                  }}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    inputMode === 'paste' 
                      ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Raw Text</span>
                </button>
              </div>

              {!resumeText.trim() && !structuredProfile && (
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  title="Prefill with complete sample resume"
                >
                  Use Sample
                </button>
              )}
            </div>
          )}
        </div>

        {useSavedProfile && savedProfile?.resumeData ? (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm">
                  Using saved profile: {savedProfile.resumeData.personal_info.full_name || user?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseSavedProfile(false)}
                className="text-xs text-emerald-800 hover:text-emerald-950 underline font-medium cursor-pointer"
              >
                Upload different resume instead
              </button>
            </div>
            <div className="text-xs text-emerald-800 space-y-1 pl-6">
              <p>• Contact: {savedProfile.resumeData.personal_info.contact.email} | {savedProfile.resumeData.personal_info.contact.phone}</p>
              <p>• Work Experience: {savedProfile.resumeData.work_experience?.map(w => w.company).join(', ') || 'None recorded'}</p>
              <p>• Education: {savedProfile.resumeData.education?.map(e => e.university).join(', ') || 'None recorded'}</p>
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
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Paste raw resume text or edit here:</span>
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
                              addToast('Converted raw text to structured sections with NLP!', 'success');
                              return;
                            }
                          }
                        } catch (e) {
                          console.warn('NLP parse request failed, falling back to local NLP:', e);
                        } finally {
                          setIsParsingText(false);
                        }
                        setStructuredProfile(parseResumeTextToData(resumeText));
                        setInputMode('form');
                        addToast('Parsed into structured form sections with local NLP!', 'info');
                      }}
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline disabled:opacity-50"
                    >
                      {isParsingText ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing with NLP...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Parse with NLP into Form →</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setStructuredProfile(parseResumeTextToData(e.target.value));
                  }}
                  placeholder="Paste your current resume text here..."
                  className="w-full h-44 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden resize-y text-xs sm:text-sm font-mono transition-colors"
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Step 2: Job Description Section */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-900">Target Job Description</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{jobDescription.length} characters</span>
        </div>

        {/* Quick Sample Job Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500">Quick Fill:</span>
          {SAMPLE_JOBS.map((job) => (
            <button
              key={job.title}
              type="button"
              onClick={() => {
                setJobDescription(job.description);
                addToast(`Loaded ${job.title} job description!`, 'info');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 hover:text-indigo-700 bg-slate-100/80 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
            >
              <Briefcase className="w-3 h-3 text-indigo-500" />
              <span>{job.title}</span>
              <span className="text-[9px] text-slate-400 font-normal">({job.badge})</span>
            </button>
          ))}
        </div>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the target job description or click one of the quick-fill chips above..."
          className="w-full h-44 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden resize-y text-xs sm:text-sm transition-colors"
        />
      </section>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating || 
            (!resumeText.trim() && !structuredProfile && (!useSavedProfile || !savedProfile?.resumeData)) || 
            !jobDescription.trim()
          }
          className="flex-1 flex items-center justify-center min-h-[52px] py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer text-base"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-3 px-2">
              <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white transition-opacity duration-300">
                {generationStep || 'Analyzing job requirements & matching achievements...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Tailor &amp; Generate Resume</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setResumeData(sampleResumeData);
            addToast('Loaded interactive studio preview with sample profile.', 'info');
          }}
          disabled={isGenerating}
          className="flex items-center justify-center py-3.5 px-5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title="Directly launch editor with demo resume"
        >
          Explore Live Canvas →
        </button>
      </div>
    </div>
  );
}
