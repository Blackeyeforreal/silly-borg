import zlib from 'zlib';

// Polyfill minimal browser globals in Node.js / Vercel Serverless
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.a = init[0] ?? 1;
        this.b = init[1] ?? 0;
        this.c = init[2] ?? 0;
        this.d = init[3] ?? 1;
        this.e = init[4] ?? 0;
        this.f = init[5] ?? 0;
      }
    }
  };
}

if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class Path2D {};
}

if (typeof (globalThis as any).ImageData === 'undefined') {
  (globalThis as any).ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
  };
}

/**
 * Primary Serverless Extractor:
 * Uses Mozilla's official pdfjs-dist legacy Node.js build without worker threads or canvas.
 */
async function extractWithPdfJsLegacy(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const u8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const loadingTask = pdfjsLib.getDocument({
    data: u8,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const doc = await loadingTask.promise;
  const pagesText: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageStrings = content.items
      .map((item: any) => item.str || '')
      .filter((s: string) => s.length > 0);
    
    if (pageStrings.length > 0) {
      pagesText.push(pageStrings.join(' '));
    }
  }

  return pagesText.join('\n\n').trim();
}

/**
 * Secondary Pure-JS Fallback:
 * Extracts plain text from PDF stream objects directly using zlib decompression.
 */
export function extractTextFromPdfStreamFallback(buffer: Buffer): string {
  const textBlocks: string[] = [];
  const content = buffer.toString('binary');

  // Match all streams across varied PDF line endings (stream\r\n, stream\n, stream\r)
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = match[1];
    let decompressed: string = rawStream;

    try {
      const streamBuf = Buffer.from(rawStream, 'binary');
      decompressed = zlib.inflateSync(streamBuf).toString('utf-8');
    } catch {
      // Try raw inflate if zlib header varies
      try {
        const streamBuf = Buffer.from(rawStream, 'binary');
        decompressed = zlib.inflateRawSync(streamBuf).toString('utf-8');
      } catch {
        decompressed = rawStream;
      }
    }

    // Extract Tj operators: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const str = cleanPdfString(tjMatch[1]);
      if (str) textBlocks.push(str);
    }

    // Extract TJ array operators: [(part1) 20 (part2)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(decompressed)) !== null) {
      const inner = arrayMatch[1];
      const innerParts = inner.match(/\(([^)]*)\)/g) || [];
      const combined = innerParts.map((p) => cleanPdfString(p.slice(1, -1))).join(' ');
      if (combined.trim()) textBlocks.push(combined.trim());
    }

    // Extract Hex strings: <48656C6C6F> Tj
    const hexRegex = /<([0-9a-fA-F]+)>\s*(?:Tj|'|")/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRegex.exec(decompressed)) !== null) {
      try {
        const decoded = Buffer.from(hexMatch[1], 'hex').toString('utf-8');
        if (decoded.trim()) textBlocks.push(decoded.trim());
      } catch {
        // ignore
      }
    }
  }

  const rawText = textBlocks.join('\n');
  return rawText.replace(/\n{3,}/g, '\n\n').trim();
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

/**
 * Universal PDF Text Extractor
 * 1. Executes official pdfjs-dist legacy Node engine (no worker, no canvas).
 * 2. If it fails, executes zlib stream decompression fallback.
 * 3. If that fails, extracts readable printable ASCII text.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // Method 1: pdfjs-dist legacy
  try {
    const text = await extractWithPdfJsLegacy(buffer);
    if (text && text.length > 10) {
      return text;
    }
  } catch (err: any) {
    console.warn('pdfjs legacy extraction failed, trying stream fallback:', err.message || err);
  }

  // Method 2: Stream decompression fallback
  try {
    const streamText = extractTextFromPdfStreamFallback(buffer);
    if (streamText && streamText.length > 10) {
      return streamText;
    }
  } catch (err: any) {
    console.warn('Stream extraction fallback failed, trying ASCII extraction:', err.message || err);
  }

  // Method 3: Printable string extraction
  const asciiClean = buffer
    .toString('binary')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (asciiClean.length > 50) {
    return asciiClean;
  }

  throw new Error('Unable to extract text from this PDF. Please verify it contains selectable text.');
}
