"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut, Library, Heart } from "lucide-react"
import { authAPI } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import type { User as UserType } from "@/lib/types/auth"

interface UserMenuProps {
  user: UserType
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await authAPI.logout()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar || undefined} alt={user.username} />
            <AvatarFallback className="bg-emerald-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push(`/profile/${user.username}`)}
          >
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push(`/profile/${user.username}?tab=library`)}
          >
            <Library className="mr-2 h-4 w-4" />
            My Library
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push(`/profile/${user.username}?tab=favorites`)}
          >
            <Heart className="mr-2 h-4 w-4" />
            Favorites
          </Button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoading ? "Logging out..." : "Log out"}
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}