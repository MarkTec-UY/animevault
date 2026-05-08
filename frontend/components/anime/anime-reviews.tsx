import Image from "next/image"
import { Star, ThumbsUp } from "lucide-react"
import type { AnimeData } from "@/lib/types/anime"

interface AnimeReviewsProps {
  reviews: AnimeData["reviews"]
  averageScore: number
}

export function AnimeReviews({ reviews, averageScore }: AnimeReviewsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Reviews</h2>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
          <p className="text-xs text-muted-foreground">
            Community average: {averageScore.toFixed(1)} / 10
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                  <Image src={review.avatar} alt={review.author} fill className="object-cover object-top" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.author}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-secondary border border-border rounded-xl px-3 py-1.5 shrink-0">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-foreground">{review.score}</span>
                <span className="text-xs text-muted-foreground">/10</span>
              </div>
            </div>

            {/* Body */}
            <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>

            {/* Footer */}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful ({review.helpful.toLocaleString()})
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
