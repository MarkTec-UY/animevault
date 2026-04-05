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

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      ...apiImageOrigins,
      { protocol: "https", hostname: "s4.anilist.co", pathname: "/**" },
      { protocol: "https", hostname: "cdn.example.com", pathname: "/**" },
    ],
  },
}

export default nextConfig
