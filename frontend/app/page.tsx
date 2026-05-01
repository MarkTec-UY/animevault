import { HeroSection } from "@/components/shared/hero-section"
import { TrendingSection } from "@/components/shared/trending-section"
import { SeasonalSection } from "@/components/shared/seasonal-section"
import { TopRatedSection } from "@/components/shared/top-rated-section"
import { GenreSection } from "@/components/shared/genre-section"
import { StatsBanner } from "@/components/shared/stats-banner"
import { CtaSection } from "@/components/shared/cta-section"
import { Footer } from "@/components/layout/footer"
import {
  getHomePageData,
  HOME_PAGE_REVALIDATE_SECONDS,
} from "@/features/home/get-home-page-data"

export const revalidate = HOME_PAGE_REVALIDATE_SECONDS

export default async function HomePage() {
  const homePageData = await getHomePageData()

  return (
    <main className="min-h-screen bg-background">
      <HeroSection
        featured={homePageData.hero.featured}
        spotlight={homePageData.hero.spotlight}
      />
      <TrendingSection items={homePageData.trending} />
      <SeasonalSection label={homePageData.seasonal.label} items={homePageData.seasonal.items} />
      <StatsBanner items={homePageData.stats} />
      <TopRatedSection items={homePageData.topRated} />
      <GenreSection items={homePageData.genres} />
      <CtaSection />
      <Footer />
    </main>
  )
}
