/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'p16.tiktokcdn.com',
      'sf16-ies-music-va.tiktokcdn.com',
      'p77-sign-va.tiktokcdn.com',
      'p9-sign-sg.tiktokcdn.com',
      'tikwm.com'
    ]
  }
};
module.exports = nextConfig;
