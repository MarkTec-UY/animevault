import Link from "next/link"
import { UserX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function UserNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 pt-16">
      <div className="max-w-md rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <UserX className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-2xl text-foreground">
          User not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find a user with that username, or their profile is
          not visible.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/anime">Browse anime</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
