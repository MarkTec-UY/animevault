import Image from "next/image"
import type { AnimeData } from "@/lib/types/anime"
import { Badge } from "@/components/ui/badge"

interface AnimeCharactersProps {
  characters: AnimeData["characters"]
}

export function AnimeCharacters({ characters }: AnimeCharactersProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Characters</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {characters.map((char) => (
          <div
            key={char.id}
            className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={char.image}
                alt={char.name}
                fill
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2">
                <Badge
                  variant="secondary"
                  className={
                    char.role === "Main"
                      ? "bg-primary/20 text-primary border-primary/30 text-xs"
                      : "bg-secondary text-muted-foreground border-border text-xs"
                  }
                >
                  {char.role}
                </Badge>
              </div>
            </div>
            <div className="p-3 space-y-0.5">
              <p className="text-sm font-medium text-foreground truncate">{char.name}</p>
              <p className="text-xs text-muted-foreground truncate">{char.voiceActor}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
