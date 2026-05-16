import Image from "next/image"
import type { StaffMember } from "@/lib/types/anime"

interface AnimeStaffProps {
  staff: StaffMember[]
}

export function AnimeStaff({ staff }: AnimeStaffProps) {
  if (staff.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-foreground">Staff</h2>
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          Staff information is not available yet for this title.
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-foreground">Staff</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {staff.map((member) => (
          <article
            key={member.entryKey}
            className="group flex h-[80px] overflow-hidden rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-200"
          >
            {/* Staff image */}
            <div className="relative w-[60px] shrink-0 overflow-hidden">
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="60px"
                className="object-cover object-top"
              />
            </div>

            {/* Staff info */}
            <div className="flex flex-col justify-between py-2.5 px-3 min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {member.name}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {member.role}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
