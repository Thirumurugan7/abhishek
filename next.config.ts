import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Add rewrites configuration
  async rewrites() {
    return [
      // Main game route
      {
        source: '/play',
        destination: 'https://game.metakraft.live'
      },
      // Unity build files
      {
        source: '/Build/:path*',
        destination: 'https://game.metakraft.live/Build/:path*'
      },
      // Template data files
      {
        source: '/TemplateData/:path*',
        destination: 'https://game.metakraft.live/TemplateData/:path*'
      },
      // Catch all other game-related assets
      {
        source: '/play/:path*',
        destination: 'https://game.metakraft.live/:path*'
      }
    ];
  }
};

export default nextConfig;
