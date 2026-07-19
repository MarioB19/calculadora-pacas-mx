import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://platform.inovaris.online https://*.inovaris.online http://localhost:*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
