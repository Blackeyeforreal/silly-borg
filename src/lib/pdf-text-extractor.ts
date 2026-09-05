import zlib from 'zlib';

// 1. Ensure required browser globals are polyfilled in Node.js / Vercel Serverless environment
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
 * Robust pure-JS fallback to extract plain text from PDF stream objects
 * when standard PDF parser libraries encounter environment or structure errors.
 */
export function extractTextFromPdfStreamFallback(buffer: Buffer): string {
  const textBlocks: string[] = [];
  const content = buffer.toString('binary');

  // Find all stream ... endstream chunks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = match[1];
    let decompressed: string = rawStream;

    // Attempt zlib flate decompression
    try {
      const streamBuf = Buffer.from(rawStream, 'binary');
      decompressed = zlib.inflateSync(streamBuf).toString('utf-8');
    } catch {
      // Stream might be uncompressed or use raw ASCII
      decompressed = rawStream;
    }

    // Extract text strings from PDF text operators:
    // (Text) Tj, (Text) ' , (Text) "
    // [(Text) 123 (More)] TJ
    const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    while ((tjMatch = tjRegex.exec(decompressed)) !== null) {
      const str = cleanPdfString(tjMatch[1]);
      if (str) textBlocks.push(str);
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = tjArrayRegex.exec(decompressed)) !== null) {
      const inner = arrayMatch[1];
      const innerParts = inner.match(/\(([^)]+)\)/g) || [];
      const combined = innerParts.map((p) => cleanPdfString(p.slice(1, -1))).join(' ');
      if (combined.trim()) textBlocks.push(combined.trim());
    }

    // Also look for hex-encoded strings: <48656C6C6F> Tj
    const hexRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRegex.exec(decompressed)) !== null) {
      try {
        const decoded = Buffer.from(hexMatch[1], 'hex').toString('utf-8');
        if (decoded.trim()) textBlocks.push(decoded.trim());
      } catch {
        // ignore invalid hex
      }
    }
  }

  // Join text blocks cleanly into coherent paragraphs
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
 * 1. Tries pdf-parse with DOMMatrix polyfills
 * 2. Falls back to stream decompression if pdf-parse fails for any reason
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // Try pdf-parse first
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse');
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      if (result?.text && result.text.trim().length > 20) {
        return result.text.trim();
      }
    } else if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      if (data?.text && data.text.trim().length > 20) {
        return data.text.trim();
      }
    }
  } catch (err: any) {
    console.warn('pdf-parse encountered error, switching to stream extractor fallback:', err.message || err);
  }

  // Fallback to pure-JS stream extraction
  const fallbackText = extractTextFromPdfStreamFallback(buffer);
  if (fallbackText && fallbackText.length > 10) {
    return fallbackText;
  }

  // Last-ditch ASCII string extraction
  const asciiClean = buffer
    .toString('binary')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (asciiClean.length > 50) {
    return asciiClean;
  }

  throw new Error('Unable to extract text from this PDF file. Please ensure it contains selectable text.');
}
