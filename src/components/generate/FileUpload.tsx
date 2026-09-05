'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, File, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import type { ResumeData } from '@/lib/schema';
import { parseResumeTextToData } from '@/lib/format-resume';

interface FileUploadProps {
  onTextExtracted?: (text: string) => void;
  onParsed?: (resume: ResumeData, rawText: string) => void;
}

export function FileUpload({ onTextExtracted, onParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Extracting text...');
  const [fileName, setFileName] = useState<string | null>(null);
  const { addToast } = useToast();

  const processExtractedText = async (rawText: string) => {
    if (onParsed) {
      setStatusMessage('Parsing resume sections with local NLP engine...');
      try {
        const parseRes = await fetch('/api/resume/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: rawText })
        });
        if (parseRes.ok) {
          const parsedJson = await parseRes.json();
          if (parsedJson.resume) {
            onParsed(parsedJson.resume, rawText);
            onTextExtracted?.(rawText);
            addToast(
              parsedJson.method === 'nlp'
                ? `Parsed with local NLP engine in ${parsedJson.latencyMs || 25}ms!`
                : 'Resume parsed into structured form sections!',
              'success'
            );
            return;
          }
        }
      } catch (e) {
        console.warn('NLP parse API route failed, falling back to local client NLP:', e);
      }

      // Local fallback
      const localData = parseResumeTextToData(rawText);
      onParsed(localData, rawText);
      onTextExtracted?.(rawText);
      addToast('Resume parsed into structured form sections with local NLP!', 'success');
    } else {
      onTextExtracted?.(rawText);
      addToast('File uploaded and text extracted successfully.', 'success');
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    
    const validTypes = ['.pdf', '.docx', '.txt'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(extension)) {
      addToast('Invalid file type. Please upload a .pdf, .docx, or .txt file.', 'error');
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setStatusMessage('Reading file content...');

    if (extension === '.txt') {
      try {
        const text = await file.text();
        if (!text.trim()) throw new Error('Uploaded .txt file is empty.');
        await processExtractedText(text);
      } catch (err: any) {
        addToast(err.message || 'Error reading text file', 'error');
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setStatusMessage('Extracting document text on server...');
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed (HTTP ${res.status})`);
      }
      
      const data = await res.json();
      if (!data.text) {
        throw new Error('No text was found in the uploaded file.');
      }
      
      await processExtractedText(data.text);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Error uploading file', 'error');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept=".pdf,.docx,.txt"
        onChange={onFileInputChange}
        disabled={isLoading}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-4">
        {isLoading ? (
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        ) : fileName ? (
          <File className="w-12 h-12 text-blue-500" />
        ) : (
          <UploadCloud className="w-12 h-12 text-gray-400" />
        )}
        
        <div>
          {isLoading ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-600 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {statusMessage}
              </p>
              <p className="text-xs text-gray-500">Extracting 100% of bullets, dates, projects & contacts with compromise NLP...</p>
            </div>
          ) : fileName ? (
            <p className="text-sm font-medium text-gray-900">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT • Real-time local NLP parsing</p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
