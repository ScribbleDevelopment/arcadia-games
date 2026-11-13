import Link from 'next/link'
import { GenreGame } from '@/components/genre-games'
import type { GameGenre } from '@/lib/games'

export function GameRoom({ title, genre, slug }: { title: string; genre: GameGenre; slug: string }) {
  const seed = Array.from(title).reduce((total, character) => total + character.charCodeAt(0), 0)

  return (
    <section className="mt-8 w-full max-w-3xl text-left" aria-label={`${title} solo game`}>
      <GenreGame title={title} genre={genre} seed={seed} slug={slug} />
      <p className="mt-4 text-center text-[11px] text-slate-500">Want a live opponent? Find a match in <Link href="/rooms" className="font-semibold text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-white">Grid Tactics, Connect Four, or Five in a Row</Link>.</p>
    </section>
  )
}
