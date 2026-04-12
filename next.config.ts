import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { version } from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Leaflet needs client-side rendering; mark it as external to avoid SSR issues
  transpilePackages: ["leaflet", "react-leaflet"],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default withNextIntl(nextConfig);
