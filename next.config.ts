import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { version } from "./package.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  // Leaflet needs client-side rendering; mark it as external to avoid SSR issues
  transpilePackages: ["leaflet", "react-leaflet"],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
