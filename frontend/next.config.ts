const apiImageOrigins = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.INTERNAL_API_URL,
]
  .filter((value): value is string => Boolean(value))
  .flatMap((value) => {
    try {
      const url = new URL(value)

      return [
        {
          protocol: url.protocol.replace(":", ""),
          hostname: url.hostname,
          port: url.port || undefined,
          pathname: "/**",
        },
      ]
    } catch {
      return []
    }
  })

const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      ...apiImageOrigins,
      { protocol: "https", hostname: "s4.anilist.co", pathname: "/**" },
      { protocol: "https", hostname: "cdn.example.com", pathname: "/**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sanctum/csrf-cookie',
        destination: `${backendUrl}/sanctum/csrf-cookie`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/auth/profile',
        destination: `${backendUrl}/auth/profile`,
      },
    ]
  },
}

export default nextConfig
