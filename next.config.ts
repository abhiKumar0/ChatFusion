import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['*.ngrok.io', '*.ngrok-free.app', '*.ngrok-free.dev'],
  experimental: {
    serverComponentsExternalPackages: ['@upstash/redis'],
  },
};

export default nextConfig;
