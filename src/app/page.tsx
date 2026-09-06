'use client';

import React from 'react';
import { useResumeStore } from '@/store/resume-store';
import { useUserStore } from '@/store/user-store';
import { GenerateForm } from '@/components/generate/GenerateForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ResumeToolbar } from '@/components/toolbar/ResumeToolbar';
import { ResumeSidebar } from '@/components/sidebar/ResumeSidebar';
import { AuthModal } from '@/components/auth/AuthModal';
import { sampleResumeData } from '@/lib/sample-data';
import { FileEdit, Eye, ArrowRight, User } from 'lucide-react';

export default function Home() {
  const { resumeData, setResumeData, mobileView, setMobileView } = useResumeStore();
  const sidebarPosition = useResumeStore((state) => state.sidebarPosition);
  const { user, setAuthModalOpen } = useUserStore();

  return (
    <main className="min-h-screen bg-[#F8F7F4] text-[#141413] flex flex-col selection:bg-[#141413] selection:text-[#F8F7F4]">
      {!resumeData ? (
        <div className="min-h-screen flex flex-col">
          {/* Top Editorial Masthead Bar */}
          <header className="w-full border-b-2 border-[#141413] bg-[#FDFCFB] sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-wider uppercase font-black text-[#141413]">
                  SILLYBORG
                </span>
                <span className="sticker-pill bg-[#D4FF00] text-[#141413] text-[10px]">
                  ⚡ 0 YAP
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setResumeData(sampleResumeData)}
                  className="neo-btn px-3 py-1 bg-white hover:bg-[#D4FF00] text-xs font-mono font-bold uppercase tracking-wider text-[#141413] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Quick Specimen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-[#141413]" />

                {user ? (
                  <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase text-[#141413] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#141413]" />
                    <span>{user.name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="font-mono text-xs font-bold tracking-wider uppercase text-[#141413] hover:text-[#FF6B4A] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Account</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Hero Header: Gen Z Punch + Typographic Craft */}
          <div className="max-w-5xl mx-auto pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col">
            <div className="space-y-6 mb-10 sm:mb-14">
              {/* Vibe Sticker Cluster */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="sticker-pill bg-[#D4FF00] text-[#141413]">
                  ⚡ ZERO YAP
                </span>
                <span className="sticker-pill bg-[#E2D9FC] text-[#141413]">
                  🎯 1-PAGE LOCK IN
                </span>
                <span className="sticker-pill bg-[#FF85B3] text-[#141413]">
                  💼 ATS SECURED
                </span>
                <span className="sticker-pill bg-[#FF6B4A] text-white">
                  🔥 NO CAP FR
                </span>
              </div>

              {/* Title in Instrument Serif */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-[#141413] leading-[1.04]">
                Land the Gig. <br className="hidden sm:inline" />
                <span className="italic">Zero Yap. Perfect Typesetting.</span>
              </h1>

              {/* Subtext in IBM Plex Sans */}
              <p className="max-w-2xl text-base sm:text-lg text-[#55534E] font-normal leading-relaxed">
                The high-signal resume &amp; cover letter builder for people who refuse to get cooked by 2-page spillovers,
                clunky templates, and robotic AI fluff.
              </p>

              {/* Tactile Attributes Grid */}
              <div className="pt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="neo-box p-3.5 sm:p-4 space-y-1 bg-[#FFFDF8]">
                  <div className="font-mono text-[10px] font-black uppercase text-[#141413] bg-[#D4FF00] px-1.5 py-0.5 w-max border border-[#141413]">01 / BOUNDARY</div>
                  <div className="font-bold text-xs text-[#141413]">1-Page Auto-Tuner</div>
                  <div className="text-[11px] text-[#76736C] leading-snug">Never get cooked by 2-page spillover</div>
                </div>

                <div className="neo-box p-3.5 sm:p-4 space-y-1 bg-[#FFFDF8]">
                  <div className="font-mono text-[10px] font-black uppercase text-[#141413] bg-[#E2D9FC] px-1.5 py-0.5 w-max border border-[#141413]">02 / TARGETING</div>
                  <div className="font-bold text-xs text-[#141413]">ATS Vibe Check</div>
                  <div className="text-[11px] text-[#76736C] leading-snug">Clean metric mapping, zero buzzwords</div>
                </div>

                <div className="neo-box p-3.5 sm:p-4 space-y-1 bg-[#FFFDF8]">
                  <div className="font-mono text-[10px] font-black uppercase text-[#141413] bg-[#FF85B3] px-1.5 py-0.5 w-max border border-[#141413]">03 / COMPANION</div>
                  <div className="font-bold text-xs text-[#141413]">Matched Cover Letter</div>
                  <div className="text-[11px] text-[#76736C] leading-snug">Corporate mask or main character tone</div>
                </div>

                <div className="neo-box p-3.5 sm:p-4 space-y-1 bg-[#FFFDF8]">
                  <div className="font-mono text-[10px] font-black uppercase text-white bg-[#141413] px-1.5 py-0.5 w-max border border-[#141413]">04 / OUTPUT</div>
                  <div className="font-bold text-xs text-[#141413]">Native DOCX &amp; PDF</div>
                  <div className="text-[11px] text-[#76736C] leading-snug">100% recruiter approved standard</div>
                </div>
              </div>
            </div>

            {/* Input Form Module */}
            <div className="w-full">
              <GenerateForm />
            </div>

            {/* Minimalist Colophon Footer */}
            <footer className="mt-16 pt-6 border-t-2 border-[#141413] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#76736C] font-mono">
              <div>SILLYBORG STUDIO • VERIFIED ATS ENGINE 2.5</div>
              <div className="flex items-center gap-3">
                <span className="sticker-pill bg-[#D4FF00] text-[#141413] text-[9px]">ATS APPROVED</span>
                <span className="sticker-pill bg-[#E2D9FC] text-[#141413] text-[9px]">WORD DOCX</span>
                <span className="sticker-pill bg-[#FF85B3] text-[#141413] text-[9px]">VECTOR PDF</span>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        /* Interactive Editorial Studio Workspace */
        <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
          <ResumeToolbar />

          {/* Mobile Screen Responsive View Switcher (Visible strictly on small screens < lg) */}
          <div className="lg:hidden border-b border-[#E7E4DC] bg-[#F8F7F4] px-4 py-2 flex items-center justify-between sticky top-14 z-30 no-print">
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#76736C]">
              VIEWPORT MODE
            </div>

            <div className="flex items-center border border-[#141413] bg-white rounded-xs p-0.5">
              <button
                type="button"
                onClick={() => setMobileView('editor')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  mobileView === 'editor'
                    ? 'bg-[#141413] text-white font-bold'
                    : 'text-[#55534E] hover:text-[#141413]'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileView('preview')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                  mobileView === 'preview'
                    ? 'bg-[#141413] text-white font-bold'
                    : 'text-[#55534E] hover:text-[#141413]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Document</span>
              </button>
            </div>
          </div>

          {/* Main Dual Workspace: Adapts based on screen size */}
          <div className="flex-1 flex flex-col lg:flex-row relative min-h-0">
            {/* Desktop: Sidebar on left or right */}
            {sidebarPosition === 'left' && (
              <div className={`${mobileView === 'editor' ? 'block' : 'hidden lg:block'}`}>
                <ResumeSidebar />
              </div>
            )}
            
            {/* Document Drafting Canvas */}
            <div
              className={`flex-1 overflow-y-auto overflow-x-hidden py-6 sm:py-10 px-2 sm:px-6 lg:px-10 flex justify-center items-start min-w-0 bg-[#EFECE6] border-x border-[#E7E4DC]/60 ${
                mobileView === 'preview' ? 'block' : 'hidden lg:flex'
              }`}
            >
              <ResumePreview />
            </div>

            {sidebarPosition === 'right' && (
              <div className={`${mobileView === 'editor' ? 'block' : 'hidden lg:block'}`}>
                <ResumeSidebar />
              </div>
            )}
          </div>
        </div>
      )}
      <AuthModal />
    </main>
  );
}
