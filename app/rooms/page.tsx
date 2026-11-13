import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { OnlineLobby } from '@/components/online-lobby'
import { auth } from '@/lib/auth'

export const metadata = { title: 'Public Rooms · Arcadia Play', description: 'Join public rooms or invite friends to live player-versus-player matches.' }

export default async function RoomsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <Link href="/" className="group inline-flex items-center gap-3 text-sm font-bold text-white transition hover:text-cyan-200"><span aria-hidden="true" className="grid size-9 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">A</span>ARCADIA<span className="hidden text-slate-500 sm:inline">/ MULTIPLAYER</span></Link>
          <Link href="/" className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-white">← Back to games</Link>
        </header>
        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.12] via-white/[0.035] to-fuchsia-400/[0.08] p-6 sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 size-64 rounded-full border border-white/[0.07]" />
          <div className="relative"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">Player versus player</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Public Rooms</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Create a public lobby, join an open match, or invite a friend with a private code. Every move is stored and synced through Neon between real signed-in players.</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-200">No bots in rooms</span><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-200">Live turn sync</span><span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-200">Signed-in players</span></div></div>
        </section>
        <div className="mt-7"><OnlineLobby /></div>
      </div>
    </main>
  )
}
