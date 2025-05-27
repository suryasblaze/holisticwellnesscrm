/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "export",
  images: {
    domains: ['localhost', 'dhruvaholisticwellness.com', 'i.postimg.cc', 'zbkthjllnxxbfizrheau.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 