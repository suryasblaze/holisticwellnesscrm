/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'dhruvaholisticwellness.com', 'i.postimg.cc', 'zbkthjllnxxbfizrheau.supabase.co'],
  },
};

module.exports = nextConfig; 