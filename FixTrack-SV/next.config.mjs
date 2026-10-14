/** @type {import('next').NextConfig} */
const nextConfig = { poweredByHeader: false, distDir: process.env.FIXTRACK_BUILD_DIR || '.next' };
export default nextConfig;
