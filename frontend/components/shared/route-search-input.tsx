"use client"

import { startTransition, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface RouteSearchInputProps {
  placeholder: string
  searchValue: string
  debounceMs?: number
  className?: string
}

export function RouteSearchInput({
  placeholder,
  searchValue,
  debounceMs = 300,
  className,
}: RouteSearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== searchValue) {
      inputRef.current.value = searchValue
    }
  }, [searchValue])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = (value: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      const hasSearch = value.trim().length > 0

      if (hasSearch) {
        params.set("search", value)
      } else {
        params.delete("search")
      }

      params.delete("page")

      const nextQuery = params.toString()
      const currentQuery = searchParams.toString()

      if (nextQuery === currentQuery) {
        return
      }

      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    }, debounceMs)
  }

  return (
    <div className="relative flex-1 group w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        defaultValue={searchValue}
        onChange={(event) => handleChange(event.target.value)}
        className={className}
      />
    </div>
  )
}
