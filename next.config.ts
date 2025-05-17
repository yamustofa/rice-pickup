import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
  // Enable production source maps for debugging
  productionBrowserSourceMaps: true,
  // Configure headers for caching
  // async headers() {
  //   return [
  //     {
  //       source: '/:all*(svg|jpg|png)',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, immutable',
  //         },
  //       ],
  //     },
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'X-DNS-Prefetch-Control',
  //           value: 'on',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
