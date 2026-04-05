"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Menu, X, ChevronDown, Flame, BookOpen, TrendingUp, Star, Calendar, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchAnime } from "@/components/shared/search-anime"
import { cn } from "@/lib/utils"

const navLinks = [
  {
    label: "Anime",
    href: "/anime",
    icon: Flame,
    children: [
      { label: "Trending Now", href: "/anime/trending", icon: TrendingUp },
      { label: "Top Rated", href: "/anime/top", icon: Star },
      { label: "This Season", href: "/anime/season", icon: Calendar },
      { label: "All Genres", href: "/anime/genres", icon: Layers },
    ],
  },
  {
    label: "Manga",
    href: "/manga",
    icon: BookOpen,
    children: [
      { label: "Trending Manga", href: "/manga/trending", icon: TrendingUp },
      { label: "Top Rated", href: "/manga/top", icon: Star },
      { label: "New Releases", href: "/manga/new", icon: Calendar },
      { label: "All Genres", href: "/manga/genres", icon: Layers },
    ],
  },
  { label: "Rankings", href: "/rankings" },
  { label: "Seasonal", href: "/seasonal" },
  { label: "Community", href: "/community" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm font-serif">A</span>
            </div>
            <span className="text-foreground font-bold text-xl tracking-tight">
              Anime<span className="text-primary">Vault</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    {link.label}
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", openDropdown === link.label && "rotate-180")} />
                  </button>
                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 pt-1 w-52">
                      <div className="bg-card border border-border rounded-xl shadow-xl shadow-black/40 overflow-hidden">
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          >
                            <child.icon className="w-4 h-4 text-primary" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            <div className="hidden md:flex items-center w-64">
              <SearchAnime />
            </div>

            {/* Notifications */}
            <button className="relative hidden sm:flex p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" aria-label="Notifications">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
            </button>

            {/* Auth Buttons */}
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/register">Get Started</Link>
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md">
            <div className="py-4 space-y-1 px-2">
              {/* Mobile Search */}
              <div className="relative mb-3 w-full">
                <SearchAnime />
              </div>

              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          <child.icon className="w-3.5 h-3.5 text-primary" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-3 border-t border-border mt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
