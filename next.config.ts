import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdf-parse', 'pizzip', 'docx'],
};

export default nextConfig;
