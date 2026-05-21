"use client"

import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNowStrict, parseISO } from "date-fns"
import { Bell, CheckCheck, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"
import type { AnimeNotification } from "@/lib/api/notifications"

function notificationTimeAgo(date: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(date), { addSuffix: true })
  } catch {
    return "Just now"
  }
}

function NotificationRow({
  notification,
  onRead,
  onNavigate,
}: {
  notification: AnimeNotification
  onRead: (notification: AnimeNotification) => void
  onNavigate: () => void
}) {
  const href = notification.anime?.id ? `/anime/${notification.anime.id}` : null
  const isUnread = notification.read_at === null
  const artwork = notification.anime?.cover_image?.large ?? null

  const content = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-3 py-3 transition-colors",
        isUnread
          ? "border-primary/20 bg-primary/5 hover:border-primary/35 hover:bg-primary/8"
          : "border-border/70 bg-card hover:bg-accent/40",
      )}
    >
      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {artwork ? (
          <Image
            src={artwork}
            alt={notification.anime?.preferred_title ?? notification.title}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Bell className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {notification.anime?.preferred_title ?? notification.title}
            </p>
            <p className="mt-0.5 text-sm text-foreground/90">
              Episode {notification.episode} just aired
            </p>
          </div>
          {isUnread && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />}
        </div>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {notification.body}
        </p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
          {notificationTimeAgo(notification.created_at)}
        </p>
      </div>
    </div>
  )

  if (!href) {
    return (
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => {
          onRead(notification)
          onNavigate()
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className="block"
      onClick={() => {
        onRead(notification)
        onNavigate()
      }}
    >
      {content}
    </Link>
  )
}

interface NotificationsDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDropdown({
  open,
  onOpenChange,
}: NotificationsDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications()

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:flex"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <>
              <span
                className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary"
                aria-hidden="true"
              />
              <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[24rem] rounded-[1.4rem] border border-border/70 bg-card p-0 shadow-2xl shadow-black/20"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                : "You are up to date"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFetching && !isLoading && (
              <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => markAllAsRead()}
              disabled={unreadCount === 0 || isMarkingAllAsRead}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Read all
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl border border-border/70 bg-secondary/40"
              />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              We could not load your notifications
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try refreshing the list.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-full"
              onClick={() => {
                void refetch()
              }}
            >
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Bell className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">No notifications yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New episode alerts will appear here when a show you follow airs.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[26rem]">
            <div className="space-y-3 p-4">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onNavigate={() => onOpenChange(false)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
