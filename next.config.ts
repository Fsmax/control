import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Вложения к задачам грузятся через Server Action (лимит файла — 10 МБ).
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
