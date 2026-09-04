import React from 'react';

export interface FormattedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/**
 * Parses markdown and HTML style tokens (**bold**, *italic*, <u>underline</u>, <b>, <i>)
 * into a structured list of formatted runs for DOCX or UI rendering.
 */
export function parseFormattedRuns(rawText: string): FormattedRun[] {
  if (!rawText) return [];

  // Regex matching formatting tokens:
  // 1. ** (bold)
  // 2. * (italic)
  // 3. <u> and </u> (underline)
  // 4. <b> and </b> (bold)
  // 5. <i> and </i> (italic)
  const tokenRegex = /(\*\*|\*|<\/?u>|<\/?b>|<\/?i>|<\/?strong>|<\/?em>)/gi;
  const parts = rawText.split(tokenRegex);

  const runs: FormattedRun[] = [];
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;

  for (const part of parts) {
    if (!part) continue;

    const lower = part.toLowerCase();
    if (lower === '**' || lower === '<b>' || lower === '<strong>') {
      isBold = !isBold;
    } else if (lower === '</b>' || lower === '</strong>') {
      isBold = false;
    } else if (lower === '*' || lower === '<i>' || lower === '<em>') {
      isItalic = !isItalic;
    } else if (lower === '</i>' || lower === '</em>') {
      isItalic = false;
    } else if (lower === '<u>') {
      isUnderline = true;
    } else if (lower === '</u>') {
      isUnderline = false;
    } else {
      // Normal text run with current formatting state
      runs.push({
        text: part,
        bold: isBold || undefined,
        italic: isItalic || undefined,
        underline: isUnderline || undefined,
      });
    }
  }

  // Merge consecutive runs with identical styles
  const merged: FormattedRun[] = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (last && !!last.bold === !!r.bold && !!last.italic === !!r.italic && !!last.underline === !!r.underline) {
      last.text += r.text;
    } else {
      merged.push({ ...r });
    }
  }

  return merged;
}

/**
 * Converts formatted text containing (**bold**, *italic*, <u>underline</u>)
 * into React elements for live preview display.
 */
export function formatTextToReact(text: string): React.ReactNode {
  if (!text) return null;
  const runs = parseFormattedRuns(text);

  if (runs.length === 0) return null;
  if (runs.length === 1 && !runs[0].bold && !runs[0].italic && !runs[0].underline) {
    return runs[0].text;
  }

  return (
    <>
      {runs.map((run, idx) => {
        let content: React.ReactNode = run.text;
        if (run.underline) {
          content = <u key={`u-${idx}`} className="underline decoration-black">{content}</u>;
        }
        if (run.italic) {
          content = <em key={`i-${idx}`} className="italic">{content}</em>;
        }
        if (run.bold) {
          content = <strong key={`b-${idx}`} className="font-bold">{content}</strong>;
        }
        return <React.Fragment key={idx}>{content}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Utility to toggle wrap a selection with formatting tokens inside an input/textarea
 */
export function toggleWrapSelection(
  fullText: string,
  start: number,
  end: number,
  formatType: 'bold' | 'italic' | 'underline'
): { newText: string; newStart: number; newEnd: number } {
  const openToken = formatType === 'bold' ? '**' : formatType === 'italic' ? '*' : '<u>';
  const closeToken = formatType === 'bold' ? '**' : formatType === 'italic' ? '*' : '</u>';

  const selectedText = fullText.substring(start, end);
  const before = fullText.substring(0, start);
  const after = fullText.substring(end);

  // If already wrapped by the tokens immediately surrounding the selection, unwrap
  const tokenLen = openToken.length;
  const closeLen = closeToken.length;

  if (
    before.endsWith(openToken) &&
    after.startsWith(closeToken)
  ) {
    const unwrapBefore = before.substring(0, before.length - tokenLen);
    const unwrapAfter = after.substring(closeLen);
    return {
      newText: unwrapBefore + selectedText + unwrapAfter,
      newStart: start - tokenLen,
      newEnd: end - tokenLen,
    };
  }

  // If selected text itself is wrapped inside
  if (
    selectedText.startsWith(openToken) &&
    selectedText.endsWith(closeToken) &&
    selectedText.length >= tokenLen + closeLen
  ) {
    const inner = selectedText.substring(tokenLen, selectedText.length - closeLen);
    return {
      newText: before + inner + after,
      newStart: start,
      newEnd: start + inner.length,
    };
  }

  // Otherwise, wrap selection (or insert empty tokens if no selection)
  const wrapped = `${openToken}${selectedText}${closeToken}`;
  return {
    newText: before + wrapped + after,
    newStart: start + tokenLen,
    newEnd: end + tokenLen,
  };
}
