/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vagrova/ui'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;

