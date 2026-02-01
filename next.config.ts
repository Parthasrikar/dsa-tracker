import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress DEP0169 warning from url.parse() in dependencies
      const originalEmitWarning = process.emitWarning;
      process.emitWarning = (warning: any, ...args: any[]) => {
        if (
          typeof warning === 'string' &&
          warning.includes('DEP0169')
        ) {
          return;
        }
        return originalEmitWarning.call(process, warning, ...args);
      };
    }
    return config;
  },
};

export default nextConfig;
