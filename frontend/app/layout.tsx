import type { Metadata, Viewport } from "next"
import { Inter, Noto_Sans_JP, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { NavbarServer } from "@/components/layout/navbar-server"
import { cn } from "@/lib/utils"

import { Providers } from "./providers"
import "./globals.css"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "AnimeVault — Discover, Track & Explore Anime & Manga",
  description:
    "AnimeVault is your ultimate platform to discover, track, and explore anime and manga. Browse trending shows, seasonal picks, top-rated titles, and more.",
  keywords: [
    "anime",
    "manga",
    "watchlist",
    "AniList",
    "MyAnimeList",
    "anime tracker",
    "anime discovery",
  ],
  authors: [{ name: "AnimeVault" }],
  openGraph: {
    title: "AnimeVault — Discover, Track & Explore Anime & Manga",
    description: "Your ultimate anime and manga discovery platform.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#111827",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("dark", "font-sans", inter.variable)}>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${notoSansJP.variable} font-sans antialiased`}
      >
        <Providers>
          <NavbarServer />
          {children}
          {process.env.NODE_ENV === "production" && <Analytics />}
        </Providers>
      </body>
    </html>
  )
}
