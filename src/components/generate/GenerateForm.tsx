'use client';

import React, { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore, formatResumeDataToText } from '@/store/user-store';
import { parseResumeTextToData } from '@/lib/format-resume';
import { FileUpload } from './FileUpload';
import { ProfileEditorForm } from './ProfileEditorForm';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Loader2, CheckCircle2, User, LogIn, FileEdit } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6">
      {/* Logged in User Banner */}
      {user ? (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-900">
                Logged in as <span className="font-bold">{user.name}</span> ({user.email})
              </div>
              {savedProfile?.resumeData ? (
                <div className="text-[11px] text-blue-700">
                  Master profile loaded ({savedProfile.resumeData.work_experience?.length || 0} jobs, {savedProfile.resumeData.education?.length || 0} degrees, {savedProfile.resumeData.custom_sections?.length || 0} custom sections).
                </div>
              ) : (
                <div className="text-[11px] text-amber-700">
                  No saved profile yet. Upload once to save your master work history and template styling!
                </div>
              )}
            </div>
          </div>

          {savedProfile?.resumeData && (
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-2xs shrink-0">
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
        <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>Have an account? Log in to save your work history and template preferences.</span>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer shrink-0"
          >
            Log In
          </button>
        </div>
      )}

      {/* Resume Input Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">1. Your Current Resume</h2>
          
          {(!useSavedProfile || !savedProfile?.resumeData) && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!structuredProfile && resumeText.trim()) {
                    setStructuredProfile(parseResumeTextToData(resumeText));
                  }
                  setInputMode('form');
                }}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  inputMode === 'form' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5 text-blue-600" />
                <span>Structured Form</span>
                {structuredProfile && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (structuredProfile && !resumeText.trim()) {
                    setResumeText(formatResumeDataToText(structuredProfile));
                  }
                  setInputMode('paste');
                }}
                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  inputMode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Raw Text
              </button>
            </div>
          )}
        </div>

        {useSavedProfile && savedProfile?.resumeData ? (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50/60 text-green-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-semibold text-xs sm:text-sm">
                  Using your saved profile: {savedProfile.resumeData.personal_info.full_name || user?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseSavedProfile(false)}
                className="text-xs text-green-800 hover:text-green-950 underline font-medium cursor-pointer"
              >
                Upload different resume instead
              </button>
            </div>
            <div className="text-xs text-green-800 space-y-1 pl-6">
              <p>• Contact: {savedProfile.resumeData.personal_info.contact.email} | {savedProfile.resumeData.personal_info.contact.phone}</p>
              <p>• Work History: {savedProfile.resumeData.work_experience?.map(w => w.company).join(', ') || 'No companies recorded'}</p>
              <p>• Education: {savedProfile.resumeData.education?.map(e => e.university).join(', ') || 'No education recorded'}</p>
              {savedProfile.templateSettings && (
                <p>• Template Styling: {savedProfile.templateSettings.fontFamily} font, {savedProfile.templateSettings.accentColor} header accent</p>
              )}
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
                <div className="flex items-center justify-between text-xs text-gray-500">
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
                              addToast(
                                parsedJson.method === 'nlp'
                                  ? `Parsed into structured sections via local NLP (${parsedJson.latencyMs || 25}ms)!`
                                  : 'Converted raw text to structured form sections!',
                                'success'
                              );
                              return;
                            }
                          }
                        } catch (e) {
                          console.warn('NLP parse request failed, falling back to client NLP:', e);
                        } finally {
                          setIsParsingText(false);
                        }
                        // Fallback
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
                          <span>Parse with Local NLP into Form →</span>
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
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-xs sm:text-sm font-mono"
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Job Description Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">2. Target Job Description</h2>
          <span className="text-xs text-gray-500">{jobDescription.length} chars</span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the target job description here..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y text-xs sm:text-sm"
        />
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating || 
            (!resumeText.trim() && !structuredProfile && (!useSavedProfile || !savedProfile?.resumeData)) || 
            !jobDescription.trim()
          }
          className="flex-1 flex items-center justify-center min-h-[50px] py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2.5 max-w-full px-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-200 shrink-0" />
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white transition-opacity duration-300">
                {generationStep || 'Analyzing job description & matching skills...'}
              </span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Resume
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setResumeData(sampleResumeData);
            addToast('Loaded sample resume for editing, rewrite, and export.', 'info');
          }}
          disabled={isGenerating}
          className="flex items-center justify-center py-3 px-5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          title="Load sample resume to test preview, inline editing, and exports immediately"
        >
          Load Demo Resume
        </button>
      </div>
    </div>
  );
}
