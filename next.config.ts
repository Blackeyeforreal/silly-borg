import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mammoth', 'pizzip', 'docx', 'pdfjs-dist', 'better-sqlite3'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './Template/**/*',
      './node_modules/pdfjs-dist/**/*',
    ],
  },
};

export default nextConfig;
