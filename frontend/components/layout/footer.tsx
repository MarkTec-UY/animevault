import Link from "next/link"
import { Bird, MessageCircle, Telescope } from "lucide-react"

const footerLinks = {
  Discover: [
    { label: "Trending Anime", href: "/anime/trending" },
    { label: "Top Rated", href: "/anime/top" },
    { label: "This Season", href: "/anime/season" },
    { label: "Upcoming", href: "/anime/upcoming" },
    { label: "Browse Manga", href: "/manga" },
  ],
  Community: [
    { label: "Forums", href: "/community" },
    { label: "Reviews", href: "/reviews" },
    { label: "Rankings", href: "/rankings" },
    { label: "User Lists", href: "/lists" },
    { label: "Discord", href: "/discord" },
  ],
  Account: [
    { label: "Sign Up", href: "/register" },
    { label: "Sign In", href: "/login" },
    { label: "My Watchlist", href: "/my-list" },
    { label: "Favorites", href: "/favorites" },
    { label: "Settings", href: "/settings" },
  ],
  About: [
    { label: "About Us", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "API", href: "/api" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
}

const socialLinks = [
  { label: "GitHub", href: "https://github.com", icon: Telescope },
  { label: "Twitter", href: "https://twitter.com", icon: Bird },
  { label: "Discord", href: "https://discord.com", icon: MessageCircle },
]

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm font-serif">A</span>
              </div>
              <span className="font-bold text-lg text-foreground">
                Anime<span className="text-primary">Vault</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your comprehensive destination for discovering, tracking, and discussing anime and manga.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
