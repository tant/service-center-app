import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["https://service-center.tantran.dev"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Enable standalone output for Docker deployment
  output: "standalone",
  // Experimental: Exclude volumes directory from file watching
  experimental: {
    // Turbopack-specific optimizations
    turbo: {
      // Exclude volumes directory from file system watching
      resolveAlias: {
        // Prevent Turbopack from reading volumes directory
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Exclude volumes directory from webpack watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/volumes/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
