// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.vimeocdn.com" }, // Vimeo thumbs (if used)
      // { protocol: "https", hostname: "your-cdn.example.com" },
    ],
  },
};

export default nextConfig;

