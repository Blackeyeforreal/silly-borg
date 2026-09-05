import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mammoth', 'pdf-parse', 'pizzip', 'docx'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./Template/**/*'],
  },
};

export default nextConfig;
