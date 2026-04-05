"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AnimeNotFoundProps {
  id: string
}

export default function AnimeNotFound({ id }: AnimeNotFoundProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Decorative Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-2xl rounded-full"></div>
            <div className="relative bg-muted rounded-full p-8">
              <svg
                className="w-16 h-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">No encontrado</h1>
          <p className="text-lg text-muted-foreground">
            El anime con ID <span className="font-mono font-semibold text-foreground">{id}</span> no existe
          </p>
          <p className="text-sm text-muted-foreground">
            Este anime podría haber sido eliminado o el ID podría ser incorrecto.
          </p>
        </div>

        {/* Status Code */}
        <div className="pt-4">
          <div className="inline-flex items-center justify-center bg-muted rounded-lg px-4 py-2">
            <span className="text-sm font-mono text-muted-foreground">Error 404</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/">Volver al inicio</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/?tab=trending">Explorar animes</Link>
          </Button>
        </div>

        {/* Suggestion */}
        <div className="pt-4 text-xs text-muted-foreground">
          <p>¿Crees que esto es un error? Contacta con soporte.</p>
        </div>
      </div>
    </div>
  )
}
