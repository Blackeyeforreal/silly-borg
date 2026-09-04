import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/genai', 'mammoth', 'pdf-parse', 'pizzip', 'docx'],
};

export default nextConfig;
