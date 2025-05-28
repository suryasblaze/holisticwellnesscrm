/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'dhruvaholisticwellness.com',
      'i.postimg.cc',
      'zbkthjllnxxbfizrheau.supabase.co',
      'holisticwellnesscrm-rkg67flkp-suryasblazes-projects.vercel.app'
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'dhruvaholisticwellness.com'],
    },
  },
};

module.exports = nextConfig; 