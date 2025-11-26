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
  async rewrites() {
    return [
      {
        source: '/peerjs/:path*',
        destination: 'http://peerjs:9000/peerjs/:path*',
      },
    ];
  },
};

export default nextConfig;
