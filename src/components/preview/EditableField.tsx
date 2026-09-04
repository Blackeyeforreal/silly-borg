'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, X, Bold, Italic, Underline } from 'lucide-react';
import { AIRewritePopover } from './AIRewritePopover';
import { formatTextToReact, toggleWrapSelection } from '@/lib/format-text';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  fieldPath: string;
  className?: string;
  containerClassName?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  multiline?: boolean;
}

export function EditableField({
  value,
  onSave,
  fieldPath,
  className = '',
  containerClassName,
  as: Component = 'span',
  multiline = false
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showRewrite, setShowRewrite] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  const isInline = Boolean(
    containerClassName?.includes('inline') || 
    containerClassName?.includes('w-auto') || 
    className.includes('inline') || 
    className.includes('w-auto')
  );

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

  const applyFormatting = (formatType: 'bold' | 'italic' | 'underline') => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const result = toggleWrapSelection(editValue, start, end, formatType);
    setEditValue(result.newText);

    // Restore cursor / selection after state update
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Rich-text formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        applyFormatting('bold');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        applyFormatting('italic');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        applyFormatting('underline');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    const EditContainer = isInline ? 'span' : 'div';

    return (
      <EditContainer 
        className={`relative ${isInline ? 'inline-flex' : 'flex'} flex-col gap-1 ${isInline ? 'w-auto' : 'w-full'} ${containerClassName || ''} no-print z-20`} 
        style={isInline ? { display: 'inline-flex', width: 'auto' } : undefined}
        ref={containerRef as any}
      >
        {/* Floating Mini Formatting Toolbar */}
        <div className="flex items-center gap-0.5 mb-0.5 bg-gray-900 text-white rounded px-1.5 py-0.5 shadow-lg text-xs w-max select-none">
          <button
            type="button"
            onClick={() => applyFormatting('bold')}
            className="p-1 hover:bg-gray-700 rounded font-bold transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('italic')}
            className="p-1 hover:bg-gray-700 rounded italic transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting('underline')}
            className="p-1 hover:bg-gray-700 rounded underline transition-colors"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-gray-700 mx-1" />

          <button
            type="button"
            onClick={() => setShowRewrite(true)}
            className="p-1 hover:bg-purple-900 text-purple-300 rounded transition-colors flex items-center gap-1"
            title="AI Rewrite"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-gray-700 mx-1" />

          <button
            type="button"
            onClick={handleSave}
            className="p-1 hover:bg-green-900 text-green-300 rounded transition-colors"
            title="Save"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setEditValue(value); setIsEditing(false); }}
            className="p-1 hover:bg-red-900 text-red-300 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[40px] p-2 text-sm border-2 border-blue-500 rounded-md focus:outline-none focus:ring-0 shadow-sm bg-white text-black font-serif"
            rows={1}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`p-1 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-0 shadow-sm bg-white text-black font-serif ${isInline ? 'min-w-[140px]' : 'w-full'}`}
          />
        )}
        
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
      </EditContainer>
    );
  }

  const Container = isInline ? 'span' : 'div';

  return (
    <Container 
      className={`relative group ${containerClassName || (isInline ? 'inline-flex w-auto items-center' : 'w-full block')}`}
      style={isInline ? { display: 'inline-flex', width: 'auto', alignItems: 'center' } : undefined}
    >
      <Component 
        onClick={() => setIsEditing(true)}
        className={`editable-hover ${isInline ? 'inline' : 'w-full block'} ${className}`}
        style={isInline ? { display: 'inline', width: 'auto' } : undefined}
      >
        {value ? formatTextToReact(value) : <span className="text-gray-300 italic no-print">Click to edit</span>}
      </Component>
      
      <button 
        onClick={(e) => { e.stopPropagation(); setShowRewrite(true); }}
        className={`p-1 text-purple-500 hover:bg-purple-50 rounded transition-opacity no-print ${
          isInline 
            ? 'hidden group-hover:inline-flex absolute -top-6 left-1/2 -translate-x-1/2 bg-white shadow-sm border border-purple-200 z-10' 
            : 'opacity-0 group-hover:opacity-100 ml-1 shrink-0'
        }`}
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
    </Container>
  );
}
