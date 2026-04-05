import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

const features = [
  "Track anime & manga progress",
  "Build and share custom lists",
  "Get personalized recommendations",
  "Join seasonal community discussions",
]

export function CtaSection() {
  return (
    <section className="py-20 bg-foreground relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent blur-3xl -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Label */}
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            Free to Join
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-4xl sm:text-5xl text-background leading-tight text-balance">
              Your Anime Journey Starts Here
            </h2>
            <p className="text-background/60 text-lg leading-relaxed max-w-xl mx-auto">
              Join millions of fans tracking their watch history, discovering hidden gems, and connecting over the stories they love.
            </p>
          </div>

          {/* Features list */}
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-background/70">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
              asChild
            >
              <Link href="/register">Create Free Account</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-background/20 text-background hover:bg-background/10 rounded-xl px-8"
              asChild
            >
              <Link href="/anime">Browse Anime</Link>
            </Button>
          </div>

          <p className="text-xs text-background/40">No credit card required. Always free for core features.</p>
        </div>
      </div>
    </section>
  )
}
