/** @type {import('next').NextConfig} */
const repositoryName = "Data_Visualization";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? `/${repositoryName}` : "");

const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}/`
      }
    : {})
};

export default nextConfig;
