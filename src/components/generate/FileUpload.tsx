'use client';

import React, { useState, useCallback } from 'react';
import { UploadCloud, File, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
}

export function FileUpload({ onTextExtracted }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { addToast } = useToast();

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

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to extract text from file.');
      
      const data = await res.json();
      onTextExtracted(data.text);
      addToast('File uploaded and text extracted successfully.', 'success');
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
            <p className="text-sm font-medium text-gray-900">Extracting text...</p>
          ) : fileName ? (
            <p className="text-sm font-medium text-gray-900">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT</p>
            </>
          )}
        </div>
      </label>
    </div>
  );
}
