'use client';

import React from 'react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { GenerateForm } from '@/components/generate/GenerateForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ResumeToolbar } from '@/components/toolbar/ResumeToolbar';
import { ResumeSidebar } from '@/components/sidebar/ResumeSidebar';
import { AuthModal } from '@/components/auth/AuthModal';
import { 
  Sparkles, 
  Zap, 
  FileCheck2, 
  FileSignature, 
  Download, 
  User, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { sampleResumeData } from '@/lib/sample-data';

export default function Home() {
  const { resumeData, setResumeData } = useResumeStore();
  const sidebarPosition = useResumeStore((state) => state.sidebarPosition);
  const { user, setAuthModalOpen } = useUserStore();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white flex flex-col">
      {!resumeData ? (
        <div className="relative min-h-screen bg-aura-glow bg-slate-50 flex flex-col">
          {/* Subtle Ambient Top Glow */}
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-100/50 via-indigo-50/30 to-transparent pointer-events-none -z-10" />

          {/* Landing Header */}
          <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold tracking-tight text-base sm:text-lg text-slate-900">
                SillyBorg <span className="text-blue-600 font-medium">Studio</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setResumeData(sampleResumeData)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <span>Try Demo Resume</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>

              {user ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-300" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </header>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto pt-8 pb-16 px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
            <div className="text-center mb-10 space-y-4">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 shadow-xs text-xs font-semibold text-indigo-700">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Next-Gen Career Suite • Gemini 2.5 • Zero Fluff</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Tailor Resumes &amp; Cover Letters <br className="hidden sm:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  for High-Impact Roles in Seconds
                </span>
              </h1>

              <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                Connect your accomplishments to the exact job description with XYZ metrics, 
                visual 1-page boundary enforcement, and matching executive cover letters.
              </p>

              {/* Feature Highlights Grid */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto text-left">
                <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">1-Page Auto-Tuner</div>
                    <div className="text-[10px] text-slate-500">Zero awkward spills</div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">ATS Keyword Match</div>
                    <div className="text-[10px] text-slate-500">Natural skill alignment</div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">Matched Cover Letter</div>
                    <div className="text-[10px] text-slate-500">Same job context</div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs border border-slate-200/80 rounded-xl p-2.5 shadow-2xs flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">DOCX &amp; Vector PDF</div>
                    <div className="text-[10px] text-slate-500">Perfect Word parity</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generator Card Container */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-70 -z-10" />
              <GenerateForm />
            </div>
          </div>
        </div>
      ) : (
        /* Live Editor Workspace */
        <div className="min-h-screen flex flex-col bg-slate-100">
          <ResumeToolbar />
          <div className="flex-1 flex flex-col lg:flex-row relative">
            {sidebarPosition === 'left' && <ResumeSidebar />}
            
            <div className="flex-1 overflow-y-auto overflow-x-auto py-8 px-2 sm:px-4 lg:px-8 flex justify-center items-start min-w-0 bg-dot-grid bg-slate-100/70">
              <ResumePreview />
            </div>

            {sidebarPosition === 'right' && <ResumeSidebar />}
          </div>
        </div>
      )}
      <AuthModal />
    </main>
  );
}
