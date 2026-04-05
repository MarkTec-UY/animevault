import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Play, Sparkles, Star, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { sanitizeHtml } from "@/lib/utils/text"
import { formatCompactNumber, formatEpisodes, formatScore } from "@/features/home/formatters"
import type { HomeAnime } from "@/features/home/types"

interface HeroSectionProps {
  featured: HomeAnime | null
  spotlight: HomeAnime[]
}

export function HeroSection({ featured, spotlight }: HeroSectionProps) {
  if (!featured) {
    return (
      <section className="relative min-h-[70vh] overflow-hidden border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-end gap-6 px-4 pt-32 pb-20 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Catalog syncing
          </Badge>
          <h1 className="max-w-3xl font-serif text-5xl text-foreground sm:text-6xl">
            Anime data is loading from the backend.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            The landing page is already wired to the API. As soon as the catalog responds,
            featured titles and live sections will appear here automatically.
          </p>
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/anime">Browse the catalog</Link>
          </Button>
        </div>
      </section>
    )
  }

  const popularity = formatCompactNumber(featured.popularity)

  return (
    <section className="relative min-h-screen overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        {featured.bannerImageUrl ? (
          <Image
            src={featured.bannerImageUrl}
            alt={`${featured.title} banner artwork`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                featured.coverImageColor ??
                "linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(99,163,117,0.8) 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/84 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                <TrendingUp className="h-3 w-3" />
                <span>Live from the catalog</span>
              </div>
              {featured.seasonLabel ? (
                <Badge variant="secondary" className="border-accent/25 bg-accent/15 text-accent">
                  {featured.seasonLabel}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="max-w-4xl font-serif text-5xl leading-tight text-foreground text-balance sm:text-6xl lg:text-7xl">
                {featured.title}
              </h1>
              {featured.nativeTitle ? (
                <p className="text-lg text-muted-foreground" lang="ja">
                  {featured.nativeTitle}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{formatScore(featured.score)}</span>
              </div>
              {popularity ? <span className="text-muted-foreground">{popularity} popularity</span> : null}
              <span className="text-muted-foreground">{formatEpisodes(featured.episodes)}</span>
              {featured.studioName ? <span className="text-muted-foreground">{featured.studioName}</span> : null}
            </div>

            {featured.genres.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {featured.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            {featured.description ? (
              <p
                className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(featured.description) }}
              />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 rounded-xl" asChild>
                <Link href={featured.href}>
                  <Play className="h-4 w-4 fill-current" />
                  View featured anime
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 rounded-xl" asChild>
                <Link href="/anime">
                  <Sparkles className="h-4 w-4" />
                  Explore catalog
                </Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Spotlight
                </h2>
                <Link
                  href="/anime"
                  className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
                >
                  View catalog <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              {spotlight.map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card/65 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-card"
                >
                  <span className="w-8 shrink-0 font-serif text-2xl text-primary/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="48px"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: item.coverImageColor ?? "rgba(99,163,117,0.18)" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatScore(item.score)}</span>
                      {item.seasonLabel ? <span>{item.seasonLabel}</span> : null}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
