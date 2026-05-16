import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MangaIdRedirectPage({ params }: PageProps) {
  const { id } = await params
  
  // Just redirect to the URL with the id. 
  // The [title] page will handle fetching the actual manga and redirecting to the canonical slug.
  redirect(`/manga/${id}/manga`)
}
