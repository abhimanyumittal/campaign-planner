import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/**": ["./prompts/**", "./data/**"] },
};

export default nextConfig;
