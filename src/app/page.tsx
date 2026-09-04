'use client';

import { useResumeStore } from '@/store/resume-store';
import { GenerateForm } from '@/components/generate/GenerateForm';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { ResumeToolbar } from '@/components/toolbar/ResumeToolbar';

export default function Home() {
  const resumeData = useResumeStore((state) => state.resumeData);

  return (
    <main className="min-h-screen">
      {!resumeData ? (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">AI Resume Builder</h1>
            <p className="text-xl text-gray-500">Transform your existing resume into a targeted masterpiece tailored for your next job.</p>
          </div>
          <GenerateForm />
        </div>
      ) : (
        <div className="pb-24">
          <ResumeToolbar />
          <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
            <ResumePreview />
          </div>
        </div>
      )}
    </main>
  );
}
