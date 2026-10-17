import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The old about page moved to the author page, so links and search results keep working.
  async redirects() {
    return [{ source: "/about", destination: "/authors/saniya-gazala", permanent: true }];
  },
};

export default nextConfig;
