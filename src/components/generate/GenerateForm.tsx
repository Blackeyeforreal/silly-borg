'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resume-store';
import { FileUpload } from './FileUpload';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Loader2 } from 'lucide-react';
import { sampleResumeData } from '@/lib/sample-data';

export function GenerateForm() {
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [resumeText, setResumeText] = useState('');
  
  const { 
    jobDescription, 
    setJobDescription, 
    setOriginalResumeText, 
    isGenerating, 
    setIsGenerating,
    setGenerationStep,
    setResumeData,
    generationStep
  } = useResumeStore();
  
  const { addToast } = useToast();

  const handleGenerate = async () => {
    if (!resumeText.trim()) {
      addToast('Please provide your resume content.', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      addToast('Please provide a job description.', 'error');
      return;
    }

    setOriginalResumeText(resumeText);
    setIsGenerating(true);
    setGenerationStep('Analyzing job description & matching skills...');

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeText,
          originalResumeText: resumeText,
          jobDescription
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to generate resume (HTTP ${response.status})`);
      }

      // Note: for real progressive updates, we would use SSE. Here simulating it for UX.
      setGenerationStep('Formatting resume data...');
      
      const data = await response.json();
      if (data.resume) {
        setResumeData(data.resume);
        addToast('Resume generated successfully!', 'success');
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
    <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-8">
      {/* Resume Input Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">1. Your Current Resume</h2>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                inputMode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                inputMode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Paste Text
            </button>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <FileUpload onTextExtracted={(text) => {
            setResumeText(text);
            setInputMode('paste'); // Switch to paste mode so they can see/edit the text
            addToast('Text extracted successfully. You can review it below.', 'success');
          }} />
        ) : (
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your current resume text here..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
          />
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
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
        />
      </section>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !resumeText || !jobDescription}
          className="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {generationStep || 'Generating...'}
            </>
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
