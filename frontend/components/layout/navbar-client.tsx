"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Flame,
  Layers,
  LogOut,
  Menu,
  Settings,
  Star,
  TrendingUp,
  User as UserIcon,
  X,
} from "lucide-react"

import { SearchAnime } from "@/components/shared/search-anime"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import type { User } from "@/lib/types/auth"
import { AnimeVaultLogo } from "@/components/shared/anime-vault-logo"
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown"

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%2363A375' width='100' height='100'/%3E%3Ccircle cx='50' cy='35' r='25' fill='%23fff'/%3E%3Cpath d='M20 90c0-16.5 13.5-30 30-30s30 13.5 30 30' fill='%23fff'/%3E%3C/svg%3E"

function getAvatarUrl(user: User): string {
  if (user.avatar_url) return user.avatar_url
  if (user.avatar) return user.avatar
  return DEFAULT_AVATAR
}


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

interface NavbarClientProps {
  user: User | null
}

export function NavbarClient({ user }: NavbarClientProps) {
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hoveredNavLabel, setHoveredNavLabel] = useState<string | null>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const subscribeToScroll = useCallback((onStoreChange: () => void) => {
    window.addEventListener("scroll", onStoreChange, { passive: true })
    return () => window.removeEventListener("scroll", onStoreChange)
  }, [])

  const isScrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 20,
    () => false,
  )

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition duration-300",
        isScrolled
          ? "border-b border-border bg-background/90 shadow-lg shadow-black/20 backdrop-blur-md"
          : "bg-transparent",
      )}
      style={{
        paddingRight: "var(--removed-body-scroll-bar-size)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <AnimeVaultLogo className="w-12 h-12" />
            {/* <span className="text-xl font-bold tracking-tight text-foreground">
              Anime<span className="text-primary">Vault</span>
            </span> */}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setHoveredNavLabel(link.label)}
                  onMouseLeave={() => setHoveredNavLabel(null)}
                >
                  <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    {link.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        hoveredNavLabel === link.label && "rotate-180",
                      )}
                    />
                  </button>
                  {hoveredNavLabel === link.label && (
                    <div className="absolute top-full left-0 w-52 pt-1">
                      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-black/40">
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <child.icon className="h-4 w-4 text-primary" />
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
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden w-64 items-center md:flex">
              <SearchAnime />
            </div>

            {user ? (
              <>
                <NotificationsDropdown
                  open={isNotificationsOpen}
                  onOpenChange={(open) => {
                    setIsNotificationsOpen(open)

                    if (open) {
                      setIsUserMenuOpen(false)
                    }
                  }}
                />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsUserMenuOpen((current) => {
                        const nextOpen = !current

                        if (nextOpen) {
                          setIsNotificationsOpen(false)
                        }

                        return nextOpen
                      })
                    }
                    className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-secondary"
                  >
                    <span className="relative h-8 w-8 overflow-hidden rounded-full">
                      <Image
                        src={getAvatarUrl(user)}
                        alt={user.username}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </span>
                    <span className="hidden md:inline text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        isUserMenuOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48">
                      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                        <div className="border-b border-border px-4 py-3">
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href={`/user/${user.username}`}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <UserIcon className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <button
                            type="button"
                            onClick={() => logout()}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden bg-primary text-primary-foreground hover:bg-primary/90 sm:inline-flex"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}

            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-card/95 backdrop-blur-md lg:hidden">
            <div className="space-y-1 px-2 py-4">
              <div className="relative mb-3 w-full">
                <SearchAnime />
              </div>

              {navLinks.map((link) => (
                <div key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  {link.children && (
                    <div className="mt-1 ml-4 space-y-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          onClick={() => setMobileOpen(false)}
                        >
                          <child.icon className="h-3.5 w-3.5 text-primary" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {user ? (
                <div className="mt-2 border-t border-border pt-3">
                  <div className="mb-3 px-3 text-sm">
                    <p className="font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="grid gap-2">
                    <Button asChild variant="outline" size="sm" className="justify-start">
                      <Link href={`/user/${user.username}`} onClick={() => setMobileOpen(false)}>
                        View profile
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="justify-start"
                    >
                      <Link href="/settings" onClick={() => setMobileOpen(false)}>
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex gap-2 border-t border-border pt-3">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
