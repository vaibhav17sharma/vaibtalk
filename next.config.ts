import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**"
      },
    ],
  },
// Rewrites are handled by custom server.ts proxy
  // async rewrites() { ... }
};

export default nextConfig;
