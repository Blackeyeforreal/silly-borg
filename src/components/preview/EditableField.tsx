'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Check, X, Bold, Italic, Underline, Link2 } from 'lucide-react';
import { AIRewritePopover } from './AIRewritePopover';
import { formatTextToReact, toggleWrapSelection, insertHyperlink } from '@/lib/format-text';
import { useResumeStore } from '@/store/resume-store';

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
  const activeEditingPath = useResumeStore((state) => state.activeEditingPath);
  const setActiveEditingPath = useResumeStore((state) => state.setActiveEditingPath);

  const isEditing = activeEditingPath === fieldPath;
  const [editValue, setEditValue] = useState(value);
  const [showRewrite, setShowRewrite] = useState(false);
  
  // Hyperlink Dialog State
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const savedSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const isCancelledRef = useRef(false);

  const isInline = Boolean(
    containerClassName?.includes('inline') || 
    containerClassName?.includes('w-auto') || 
    className.includes('inline') || 
    className.includes('w-auto')
  );

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // When field becomes active / inactive
  useEffect(() => {
    if (isEditing) {
      isCancelledRef.current = false;
      if (inputRef.current) {
        inputRef.current.focus();
        if (inputRef.current instanceof HTMLTextAreaElement) {
          inputRef.current.style.height = 'auto';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
      }
    } else {
      // Switched away to another field: auto-save if not explicitly cancelled
      if (!isCancelledRef.current && editValue !== value) {
        onSave(editValue);
      }
      setShowLinkDialog(false);
      setShowRewrite(false);
    }
  }, [isEditing]);

  const handleSave = () => {
    isCancelledRef.current = false;
    if (editValue !== value) {
      onSave(editValue);
    }
    setActiveEditingPath(null);
  };

  const handleCancel = () => {
    isCancelledRef.current = true;
    setEditValue(value);
    setShowLinkDialog(false);
    setActiveEditingPath(null);
  };

  const applyFormatting = (formatType: 'bold' | 'italic' | 'underline') => {
    const el = inputRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const result = toggleWrapSelection(editValue, start, end, formatType);
    setEditValue(result.newText);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  const openLinkDialog = () => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? 0;
    const end = el?.selectionEnd ?? 0;
    savedSelectionRef.current = { start, end };
    
    const selected = editValue.substring(start, end);
    setLinkText(selected);
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      setShowLinkDialog(false);
      return;
    }

    const { start, end } = savedSelectionRef.current;
    const result = insertHyperlink(editValue, start, end, linkUrl, linkText.trim() || undefined);
    setEditValue(result.newText);
    setShowLinkDialog(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(result.newStart, result.newEnd);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      if (key === 'k') {
        e.preventDefault();
        openLinkDialog();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !multiline && !showLinkDialog) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      if (showLinkDialog) {
        setShowLinkDialog(false);
      } else {
        handleCancel();
      }
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

          <button
            type="button"
            onClick={openLinkDialog}
            className={`p-1 hover:bg-gray-700 rounded transition-colors ${showLinkDialog ? 'bg-blue-600' : ''}`}
            title="Add Link (Ctrl+K)"
          >
            <Link2 className="w-3.5 h-3.5" />
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
            onClick={handleCancel}
            className="p-1 hover:bg-red-900 text-red-300 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inline Hyperlink Dialog */}
        {showLinkDialog && (
          <div className="flex items-center gap-1.5 p-1.5 bg-white border border-blue-400 rounded shadow-md text-xs mb-1 w-max">
            <input
              type="text"
              placeholder="Display text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs w-28 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="URL (e.g. https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertLink()}
              autoFocus
              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs w-44 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleInsertLink}
              className="px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-xs cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowLinkDialog(false)}
              className="p-0.5 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
        onClick={() => setActiveEditingPath(fieldPath)}
        className={`editable-hover ${isInline ? 'inline' : 'w-full block'} ${className}`}
        style={isInline ? { display: 'inline', width: 'auto' } : undefined}
      >
        {value ? formatTextToReact(value) : <span className="text-gray-300 italic no-print">Click to edit</span>}
      </Component>
    </Container>
  );
}
