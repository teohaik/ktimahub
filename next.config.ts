import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Leaflet needs client-side rendering; mark it as external to avoid SSR issues
  transpilePackages: ["leaflet", "react-leaflet"],
};

export default withNextIntl(nextConfig);
