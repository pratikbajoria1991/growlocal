/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This project sits inside a larger folder tree with other package.json files.
  // Pin the Turbopack root so it doesn't infer a workspace root above us.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
    ],
  },
};

module.exports = nextConfig;
