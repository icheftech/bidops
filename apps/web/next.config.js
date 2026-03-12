/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@bidops/db', '@bidops/types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
