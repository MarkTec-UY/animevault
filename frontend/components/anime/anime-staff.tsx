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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div
            key={member.id}
            className="group flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all duration-200"
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-border">
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {member.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
