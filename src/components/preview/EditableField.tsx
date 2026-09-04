'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { AIRewritePopover } from './AIRewritePopover';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  fieldPath: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  multiline?: boolean;
}

export function EditableField({
  value,
  onSave,
  fieldPath,
  className = '',
  as: Component = 'span',
  multiline = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showRewrite, setShowRewrite] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`relative flex flex-col gap-1 w-full ${className} no-print`} ref={containerRef}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[40px] p-2 text-sm border-2 border-blue-500 rounded-md focus:outline-none focus:ring-0 shadow-sm bg-white"
            rows={1}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-0 shadow-sm bg-white"
          />
        )}
        <div className="flex justify-end gap-1 absolute right-0 -bottom-8 z-10 bg-white p-1 rounded-md shadow-md border">
          <button onClick={() => setShowRewrite(true)} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="AI Rewrite">
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Save">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditValue(value); setIsEditing(false); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Cancel">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {showRewrite && (
          <AIRewritePopover
            currentValue={editValue}
            fieldPath={fieldPath}
            onRewrite={(newVal) => {
              setEditValue(newVal);
              setShowRewrite(false);
            }}
            onClose={() => setShowRewrite(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative group inline-block w-full">
      <Component 
        onClick={() => setIsEditing(true)}
        className={`editable-hover w-full block ${className}`}
      >
        {value || <span className="text-gray-300 italic no-print">Click to edit</span>}
      </Component>
      
      <button 
        onClick={(e) => { e.stopPropagation(); setShowRewrite(true); }}
        className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 text-purple-500 opacity-0 group-hover:opacity-100 hover:bg-purple-50 rounded transition-opacity no-print"
        title="AI Rewrite"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>

      {showRewrite && (
        <AIRewritePopover
          currentValue={value}
          fieldPath={fieldPath}
          onRewrite={(newVal) => {
            onSave(newVal);
            setShowRewrite(false);
          }}
          onClose={() => setShowRewrite(false)}
        />
      )}
    </div>
  );
}
