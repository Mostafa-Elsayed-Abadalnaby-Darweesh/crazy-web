/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // konva ships an optional node "canvas" dependency that must never be bundled for the browser
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};
export default nextConfig;
