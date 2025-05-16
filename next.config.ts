import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore-next-line
    instrumentationHook: true,
  },
};

export default nextConfig;
