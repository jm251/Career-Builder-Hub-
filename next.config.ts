import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
