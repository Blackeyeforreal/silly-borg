import React from 'react';

export interface FormattedRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  linkUrl?: string;
}

/**
 * Parses inline formatting tags (**bold**, *italic*, <u>underline</u>, <b>, <i>)
 */
function parseInlineFormatting(rawText: string): FormattedRun[] {
  if (!rawText) return [];

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
      runs.push({
        text: part,
        bold: isBold || undefined,
        italic: isItalic || undefined,
        underline: isUnderline || undefined,
      });
    }
  }

  return runs;
}

/**
 * Parses markdown and HTML style tokens (**bold**, *italic*, <u>underline</u>, and [label](url))
 * into a structured list of formatted runs for DOCX or UI rendering.
 */
export function parseFormattedRuns(rawText: string): FormattedRun[] {
  if (!rawText) return [];

  // Match markdown links: [label](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  const runs: FormattedRun[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(rawText)) !== null) {
    const beforeText = rawText.substring(lastIndex, match.index);
    if (beforeText) {
      runs.push(...parseInlineFormatting(beforeText));
    }

    const label = match[1];
    const url = match[2];
    const labelRuns = parseInlineFormatting(label);

    if (labelRuns.length === 0) {
      runs.push({ text: label, linkUrl: url });
    } else {
      for (const lr of labelRuns) {
        runs.push({ ...lr, linkUrl: url });
      }
    }

    lastIndex = linkRegex.lastIndex;
  }

  const remaining = rawText.substring(lastIndex);
  if (remaining) {
    runs.push(...parseInlineFormatting(remaining));
  }

  // Merge consecutive runs with identical styles
  const merged: FormattedRun[] = [];
  for (const r of runs) {
    const last = merged[merged.length - 1];
    if (
      last &&
      !!last.bold === !!r.bold &&
      !!last.italic === !!r.italic &&
      !!last.underline === !!r.underline &&
      last.linkUrl === r.linkUrl
    ) {
      last.text += r.text;
    } else {
      merged.push({ ...r });
    }
  }

  return merged;
}

/**
 * Converts formatted text containing (**bold**, *italic*, <u>underline</u>, [label](url))
 * into React elements for live preview display.
 */
export function formatTextToReact(text: string): React.ReactNode {
  if (!text) return null;
  const runs = parseFormattedRuns(text);

  if (runs.length === 0) return null;
  if (runs.length === 1 && !runs[0].bold && !runs[0].italic && !runs[0].underline && !runs[0].linkUrl) {
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
        if (run.linkUrl) {
          const href = run.linkUrl.startsWith('http://') || run.linkUrl.startsWith('https://') || run.linkUrl.startsWith('mailto:')
            ? run.linkUrl
            : `https://${run.linkUrl}`;
          content = (
            <a
              key={`a-${idx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline decoration-blue-500 font-medium inline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </a>
          );
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

/**
 * Inserts or wraps selection as a markdown hyperlink: [label](url)
 */
export function insertHyperlink(
  fullText: string,
  start: number,
  end: number,
  url: string,
  customLabel?: string
): { newText: string; newStart: number; newEnd: number } {
  const selectedText = fullText.substring(start, end);
  const label = customLabel || selectedText || 'Link';
  const cleanUrl = url.trim();
  const linkMarkdown = `[${label}](${cleanUrl})`;

  const before = fullText.substring(0, start);
  const after = fullText.substring(end);
  const newText = before + linkMarkdown + after;
  const newStart = start;
  const newEnd = start + linkMarkdown.length;
  return { newText, newStart, newEnd };
}

