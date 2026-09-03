/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8100";
const isExport = process.env.NEXT_EXPORT === "true" || process.env.CLOUDFLARE_PAGES === "1";

const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...(isExport
    ? { output: "export" }
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${BACKEND_URL}/api/:path*`,
            },
          ];
        },
      }),
};

module.exports = nextConfig;
