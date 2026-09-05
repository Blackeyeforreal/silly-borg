import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mammoth', 'pizzip', 'docx', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/**/*': [
      './Template/**/*',
      './node_modules/pdfjs-dist/**/*',
    ],
  },
};

export default nextConfig;
