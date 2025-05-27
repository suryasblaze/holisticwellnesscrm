/** @type {import('next').NextConfig} */
const repoName = 'holisticwellnesscrm'; // Your repository name
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '/';
let basePath = '';

if (isGithubActions) {
  // trim off `<owner>/`
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*\//, '');

  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}


const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // Required for static export with next/image
    domains: ['localhost', 'dhruvaholisticwellness.com', 'i.postimg.cc'],
  },
  basePath: basePath,
  assetPrefix: assetPrefix,
};

module.exports = nextConfig; 