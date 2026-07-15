import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3)$/i,
      type: 'asset/resource',
    });

    // Webpack's persistent snapshot cache is unreliable for this project on
    // Windows and emits "Unable to snapshot resolve dependencies" after an
    // otherwise successful production build. Development caching stays on.
    if (!dev) config.cache = false;

    return config;
  },
};

export default nextConfig;
