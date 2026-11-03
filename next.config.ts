import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-mode corner badge sat on top of the gallery's floating controls and swallowed clicks.
  // Compile and runtime errors still show; remove this line to bring the badge back.
  devIndicators: false,
};

export default nextConfig;
