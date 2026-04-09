import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jaiquezmuzic.com",
      },
    ],
  },
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;
