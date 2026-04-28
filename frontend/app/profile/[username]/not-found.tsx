import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserX } from "lucide-react"
import Link from "next/link"

export default function ProfileNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The user profile you're looking for doesn't exist or is not
            publicly visible.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="default">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/anime">Browse Anime</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}