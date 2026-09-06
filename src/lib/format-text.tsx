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
function parseInlineFormatting(rawText: string, linkUrl?: string): FormattedRun[] {
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
        linkUrl: linkUrl || undefined,
      });
    }
  }

  return runs;
}

/**
 * Parses raw URLs and emails from plain text segments that aren't already markdown links
 */
function parseRawUrlsAndEmails(text: string): { text: string; linkUrl?: string }[] {
  if (!text) return [];

  // Match URLs (http/https/www), common domains (e.g. github.com, linkedin.com), or emails
  const pattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|me|dev|app|ai|co|edu|gov)(?:\/[^\s<]*)?)/gi;
  let lastIndex = 0;
  const tokens: { text: string; linkUrl?: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchIndex = match.index;

    // Separate trailing punctuation like '.', ',', ')', ';', '!' from the actual link
    const punctMatch = rawMatch.match(/^(.*?)([.,;:!?)]*)$/);
    const actualText = punctMatch ? punctMatch[1] : rawMatch;
    const trailingPunct = punctMatch ? punctMatch[2] : '';

    if (matchIndex > lastIndex) {
      tokens.push({ text: text.substring(lastIndex, matchIndex) });
    }

    let url = actualText;
    if (url.includes('@') && !url.startsWith('mailto:')) {
      url = 'mailto:' + url;
    } else if (url.startsWith('www.')) {
      url = 'https://' + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = 'https://' + url;
    }

    tokens.push({ text: actualText, linkUrl: url });
    if (trailingPunct) {
      tokens.push({ text: trailingPunct });
    }

    lastIndex = matchIndex + rawMatch.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ text: text.substring(lastIndex) });
  }

  return tokens;
}

/**
 * Parses markdown and HTML style tokens (**bold**, *italic*, <u>underline</u>, and [label](url))
 * plus autolinks raw URLs and emails into a structured list of formatted runs.
 */
export function parseFormattedRuns(rawText: string): FormattedRun[] {
  if (!rawText) return [];

  // Match markdown links: [label](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  const rawSegments: { text: string; linkUrl?: string; isMarkdownLink?: boolean }[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      rawSegments.push({ text: rawText.substring(lastIndex, match.index) });
    }

    let url = match[2].trim();
    if (url.includes('@') && !url.startsWith('mailto:') && !url.startsWith('http')) {
      url = 'mailto:' + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      url = 'https://' + url;
    }

    rawSegments.push({
      text: match[1],
      linkUrl: url,
      isMarkdownLink: true
    });

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < rawText.length) {
    rawSegments.push({ text: rawText.substring(lastIndex) });
  }

  const runs: FormattedRun[] = [];

  for (const seg of rawSegments) {
    if (seg.isMarkdownLink) {
      // Parse inline formatting inside markdown link label
      runs.push(...parseInlineFormatting(seg.text, seg.linkUrl));
    } else {
      // Find raw URLs or emails in plain segments
      const rawTokens = parseRawUrlsAndEmails(seg.text);
      for (const tok of rawTokens) {
        if (tok.linkUrl) {
          runs.push({ text: tok.text, linkUrl: tok.linkUrl });
        } else {
          runs.push(...parseInlineFormatting(tok.text));
        }
      }
    }
  }

  // Merge consecutive runs with identical styles and links
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
 * Converts formatted text containing (**bold**, *italic*, <u>underline</u>, [label](url), raw URLs)
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
          content = <u key={`u-${idx}`} className="underline decoration-current">{content}</u>;
        }
        if (run.italic) {
          content = <em key={`i-${idx}`} className="italic">{content}</em>;
        }
        if (run.bold) {
          content = <strong key={`b-${idx}`} className="font-bold">{content}</strong>;
        }
        if (run.linkUrl) {
          const href = run.linkUrl.startsWith('http://') || run.linkUrl.startsWith('https://') || run.linkUrl.startsWith('mailto:') || run.linkUrl.startsWith('tel:')
            ? run.linkUrl
            : `https://${run.linkUrl}`;
          content = (
            <a
              key={`a-${idx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0563C1] hover:text-[#044a90] underline decoration-[#0563C1] font-medium inline transition-colors"
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
  let cleanUrl = url.trim();
  if (cleanUrl.includes('@') && !cleanUrl.startsWith('mailto:') && !cleanUrl.startsWith('http')) {
    cleanUrl = 'mailto:' + cleanUrl;
  } else if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('mailto:') && !cleanUrl.startsWith('tel:')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  const linkMarkdown = `[${label}](${cleanUrl})`;

  const before = fullText.substring(0, start);
  const after = fullText.substring(end);
  const newText = before + linkMarkdown + after;
  const newStart = start;
  const newEnd = start + linkMarkdown.length;
  return { newText, newStart, newEnd };
}
