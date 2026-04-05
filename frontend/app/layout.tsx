import type { Metadata, Viewport } from 'next'
import { Inter, DM_Serif_Display, Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AnimeVault — Discover, Track & Explore Anime & Manga',
  description: 'AnimeVault is your ultimate platform to discover, track, and explore anime and manga. Browse trending shows, seasonal picks, top-rated titles, and more.',
  keywords: ['anime', 'manga', 'watchlist', 'AniList', 'MyAnimeList', 'anime tracker', 'anime discovery'],
  authors: [{ name: 'AnimeVault' }],
  openGraph: {
    title: 'AnimeVault — Discover, Track & Explore Anime & Manga',
    description: 'Your ultimate anime and manga discovery platform.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSerifDisplay.variable} ${notoSansJP.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
