import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3)$/i,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
