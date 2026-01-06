import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Enable image optimization
  images: {
    unoptimized: true,
  },
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
