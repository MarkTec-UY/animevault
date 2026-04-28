"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserStats } from "@/lib/types/user"
import { TrendingUp, Award, Clock, Star } from "lucide-react"

interface ProfileStatsProps {
  stats?: UserStats
  loading?: boolean
}

export function ProfileStats({ stats, loading }: ProfileStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statItems = [
    {
      title: "Total Anime",
      value: stats.total_anime,
      icon: TrendingUp,
      color: "text-emerald-600",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: Award,
      color: "text-blue-600",
    },
    {
      title: "Watching",
      value: stats.watching,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Mean Score",
      value: stats.mean_score ? stats.mean_score.toFixed(2) : "N/A",
      icon: Star,
      color: "text-yellow-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}