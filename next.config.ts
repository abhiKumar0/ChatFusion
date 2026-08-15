import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['*.ngrok.io', '*.ngrok-free.app', '*.ngrok-free.dev'],
  serverExternalPackages: ['@upstash/redis'],
};

export default nextConfig;
