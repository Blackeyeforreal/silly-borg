'use client';

import { useResumeStore } from '@/store/resume-store';
import { GenerateForm } from '@/components/generate/GenerateForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ResumeToolbar } from '@/components/toolbar/ResumeToolbar';
import { ResumeSidebar } from '@/components/sidebar/ResumeSidebar';
import { AuthModal } from '@/components/auth/AuthModal';

export default function Home() {
  const resumeData = useResumeStore((state) => state.resumeData);
  const sidebarPosition = useResumeStore((state) => state.sidebarPosition);

  return (
    <main className="min-h-screen bg-slate-100">
      {!resumeData ? (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">AI Resume Builder</h1>
            <p className="text-xl text-gray-500">Transform your existing resume into a targeted masterpiece tailored for your next job.</p>
          </div>
          <GenerateForm />
        </div>
      ) : (
        <div className="min-h-screen flex flex-col">
          <ResumeToolbar />
          <div className="flex-1 flex flex-col lg:flex-row relative">
            {sidebarPosition === 'left' && <ResumeSidebar />}
            
            <div className="flex-1 overflow-y-auto overflow-x-auto py-8 px-2 sm:px-4 lg:px-8 flex justify-center items-start min-w-0">
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
