import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Ensure dynamic publication metadata resolves before streaming so
  // notFound() can return a real HTTP 404 for unknown/unpublished slugs.
  htmlLimitedBots: /.*/,
  async headers(){
    const security=[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=()"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Content-Security-Policy-Report-Only",value:"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://github.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://api.github.com https://*.vercel-storage.com; frame-src https://www.google.com https://www.google.com/maps/;"},
      ...(process.env.NODE_ENV==="production"?[{key:"Strict-Transport-Security",value:"max-age=86400; includeSubDomains"}]:[]),
    ];
    return [{source:"/:path*",headers:security}];
  },
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
