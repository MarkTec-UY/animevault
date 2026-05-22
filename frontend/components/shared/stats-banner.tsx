import { BookOpen, Film, Layers3, RadioTower } from "lucide-react"

import { formatCompactNumber } from "@/features/home/formatters"
import type { HomeStat } from "@/features/home/types"

interface StatsBannerProps {
  items: HomeStat[]
}

const statIcons = [Film, Layers3, BookOpen, RadioTower]

export function StatsBanner({ items }: StatsBannerProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="border-y border-border bg-background py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((stat, index) => {
            const Icon = statIcons[index % statIcons.length]

            return (
              <div key={stat.label} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="stat-display">
                    {formatCompactNumber(stat.value) ?? stat.value}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
