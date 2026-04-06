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
};

export default nextConfig;
