'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { freeGames, games, passGames, type ArcadiaGame, type GameMode } from '@/lib/games'

const genres = ['All', ...Array.from(new Set(games.map((game) => game.genre)))]
type ModeFilter = 'all' | 'solo' | 'multiplayer'
type TierFilter = 'all' | 'free' | 'pass'

const modeLabel: Record<GameMode, string> = {
  solo: 'Solo',
  'solo-online': 'Solo + online',
  online: 'Online multiplayer',
}

function gameHref(game: ArcadiaGame, hasPass: boolean) {
  if (game.tier === 'pass' && !hasPass) return '/pass'
  return game.mode === 'online' ? `/rooms?game=${game.slug}` : `/play/${game.slug}`
}

export function GameDirectory({ hasPass }: { hasPass: boolean }) {
  const [genre, setGenre] = useState('All')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => games.filter((game) => {
    const matchesGenre = genre === 'All' || game.genre === genre
    const matchesMode = modeFilter === 'all' || (modeFilter === 'solo' ? game.mode !== 'online' : game.mode !== 'solo')
    const matchesTier = tierFilter === 'all' || game.tier === tierFilter
    const matchesSearch = `${game.title} ${game.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesGenre && matchesMode && matchesTier && matchesSearch
  }), [genre, modeFilter, tierFilter, query])

  return (
    <section className="space-y-6" aria-labelledby="directory-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Arcadia originals</p>
          <h2 id="directory-heading" className="mt-2 text-3xl font-bold text-white">{freeGames.length} free games. {passGames.length} full campaigns.</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">Every free title is a complete game. Arcadia Pass adds two premium 3D campaigns with longer progression, boss fights, upgrades, and branching choices.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/rooms" className="rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-200">Find a match</Link>
          <Link href="/pass" className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3 text-center text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/20">Explore premium</Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-white">Arcadia radio</p><p className="mt-1 text-xs text-slate-400">A tiny chiptune loop for browsing the originals.</p></div>
        <audio controls preload="none" className="h-9 max-w-full" src="/audio/arcadia-loop.wav"><span>Your browser does not support audio playback.</span></audio>
      </div>
      <div className="flex flex-col gap-3">
        <label><span className="sr-only">Search games</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles or game rules" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-cyan-300 placeholder:text-slate-500 focus:ring-2" /></label>
        <div className="flex flex-col gap-3">
          <div className="flex gap-2" aria-label="Filter by access tier">
            {(['all', 'free', 'pass'] as const).map((tier) => <button key={tier} type="button" onClick={() => setTierFilter(tier)} aria-pressed={tierFilter === tier} className={`rounded-xl border px-3 py-2 text-sm transition ${tierFilter === tier ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'}`}>{tier === 'all' ? 'All games' : tier === 'free' ? `Free · ${freeGames.length}` : `Pass · ${passGames.length}`}</button>)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by genre">{genres.map((item) => <button key={item} type="button" onClick={() => setGenre(item)} aria-pressed={genre === item} className={`whitespace-nowrap rounded-xl border px-3 py-2 text-sm transition ${genre === item ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'}`}>{item === 'All' ? item : item[0].toUpperCase() + item.slice(1)}</button>)}</div>
            <div className="flex shrink-0 gap-2" aria-label="Filter by play mode">{(['all', 'solo', 'multiplayer'] as const).map((mode) => <button key={mode} type="button" onClick={() => setModeFilter(mode)} aria-pressed={modeFilter === mode} className={`rounded-xl border px-3 py-2 text-sm transition ${modeFilter === mode ? 'border-fuchsia-300 bg-fuchsia-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25'}`}>{mode === 'all' ? 'All modes' : mode === 'solo' ? 'Solo' : 'Multiplayer'}</button>)}</div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((game, index) => {
          const locked = game.tier === 'pass' && !hasPass
          return <article key={game.slug} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.08]">
            <div className="relative flex h-36 items-end overflow-hidden rounded-xl p-4" style={{ background: `linear-gradient(135deg, hsl(${(index * 47 + 186) % 360} 78% 50%), hsl(${(index * 47 + 278) % 360} 72% 19%))` }}><div aria-hidden="true" className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 18% 20%, white 0 1px, transparent 1px), linear-gradient(120deg, transparent 40%, rgba(255,255,255,.3) 40% 42%, transparent 42%)', backgroundSize: '18px 18px, 100% 100%' }} /><span className="relative z-10 text-4xl font-black tracking-tighter text-white/90">{game.title.split(' ').map((part) => part[0]).join('').slice(0, 3)}</span><span className="relative z-10 ml-auto rounded-full bg-slate-950/65 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">{game.mood}</span></div>
            <div className="mt-4 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{game.title}</h3><p className="mt-1 text-xs capitalize text-slate-400">{game.genre.replace('-', ' ')} · {modeLabel[game.mode]}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${game.tier === 'pass' ? 'border-fuchsia-300/25 text-fuchsia-200' : 'border-cyan-300/15 text-cyan-200'}`}>{game.tier === 'pass' ? 'Pass' : 'Free'}</span></div>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{game.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {game.mode !== 'online' && <Link href={gameHref(game, hasPass)} className="rounded-lg border border-white/10 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:text-cyan-200">{locked ? 'Unlock with Pass' : 'Play game'}</Link>}
              {game.mode !== 'solo' && <Link href={`/rooms?game=${game.slug}`} className="rounded-lg bg-cyan-300 px-3 py-2.5 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-200">{game.mode === 'online' ? 'Play online' : 'Play with friends'}</Link>}
            </div>
          </article>
        })}
      </div>
      {filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-slate-400">No games match that search.</p>}
    </section>
  )
}
