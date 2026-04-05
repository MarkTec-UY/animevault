import { Navbar } from "@/components/layout/navbar"
import { HeroSection } from "@/components/shared/hero-section"
import { TrendingSection } from "@/components/shared/trending-section"
import { SeasonalSection } from "@/components/shared/seasonal-section"
import { TopMangaSection } from "@/components/shared/top-manga-section"
import { GenreSection } from "@/components/shared/genre-section"
import { StatsBanner } from "@/components/shared/stats-banner"
import { CtaSection } from "@/components/shared/cta-section"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrendingSection />
      <SeasonalSection />
      <StatsBanner />
      <TopMangaSection />
      <GenreSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
