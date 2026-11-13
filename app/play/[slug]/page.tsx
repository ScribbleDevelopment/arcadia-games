import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { GameRoom } from '@/components/game-room'
import { auth } from '@/lib/auth'
import { hasActivePass } from '@/lib/pass-entitlements'
import { getGame } from '@/lib/games'

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = getGame(slug)
  if (!game) notFound()
  if (game.mode === 'online') redirect(`/rooms?game=${game.slug}`)
  if (game.tier === 'pass') {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) redirect(`/sign-in?next=${encodeURIComponent(`/play/${game.slug}`)}`)
    if (!(await hasActivePass(session.user.id))) redirect('/pass?required=1')
  }
  const { title, genre } = game
  const hue = Array.from(slug).reduce((total, character) => total + character.charCodeAt(0), 0) % 360

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at 50% 2%, hsl(${hue} 80% 30% / .44), transparent 50%)` }} />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <Link href="/" className="group inline-flex items-center gap-3 text-sm font-bold text-white transition hover:text-cyan-200"><span aria-hidden="true" className="grid size-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 transition group-hover:bg-cyan-300/20">A</span>ARCADIA<span className="hidden text-slate-500 sm:inline">/ GAME ROOM</span></Link>
          <div className="flex items-center gap-2"><Link href="/rooms" className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200">Public rooms</Link><Link href="/" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-white">← Games</Link></div>
        </header>

        <section className="mt-8 grid gap-7 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
          <div className="space-y-5 lg:sticky lg:top-8">
            <div className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 p-7 sm:min-h-80 sm:p-9" style={{ background: `linear-gradient(145deg, hsl(${hue} 72% 38% / .75), #11172a 58%, hsl(${(hue + 55) % 360} 60% 22% / .8))` }}>
              <div aria-hidden="true" className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 25%, white 0 1px, transparent 1.5px), radial-gradient(circle at 80% 60%, white 0 1px, transparent 1.5px)', backgroundSize: '28px 28px, 36px 36px' }} />
              <div className="relative flex items-center justify-between"><span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Arcadia original</span><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-300" />Ready</span></div>
              <div className="relative"><p className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">Now playing</p><h1 className="mt-2 max-w-lg text-4xl font-black tracking-tight sm:text-5xl">{title}</h1><p className="mt-3 max-w-sm text-sm leading-6 text-white/70">{game.description}</p></div>
              <div aria-hidden="true" className="pointer-events-none absolute -right-4 top-1/3 h-40 w-40 rounded-full border border-white/10 sm:right-8"><div className="absolute inset-5 rounded-full border border-white/10" /><div className="absolute inset-10 rounded-full border border-white/10" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[[genre.toUpperCase(), 'Game type'], [game.mode === 'solo-online' ? 'Solo + online' : 'Solo', 'Play style'], ['∞', 'Replay']].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><p className="text-xl font-black text-white">{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p></div>)}
            </div>
            <p className="px-1 text-[11px] leading-5 text-slate-500">Controls and round rules are shown inside each game. Your best run is always one more try away.</p>
          </div>

          <GameRoom title={title} genre={genre} slug={slug} />
        </section>
      </div>
    </main>
  )
}
