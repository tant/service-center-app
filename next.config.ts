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
  // Exclude volumes directory from Turbopack file system operations
  turbopack: {
    resolveExtensions: [
      ".mdx",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude volumes directory from webpack watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/volumes/**", "**/node_modules/**"],
    };
    return config;
  },
};

export default nextConfig;
