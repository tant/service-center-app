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
  // Exclude volumes directory from build process (for both Webpack and Turbopack)
  turbopack: {
    rules: {
      // Ignore volumes directory during build
      "volumes/**": {
        loaders: [],
      },
    },
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/volumes/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
