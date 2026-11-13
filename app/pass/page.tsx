import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { PassBillingPortalButton } from '@/components/pass-billing-portal-button'
import { PassCheckoutButton } from '@/components/pass-checkout-button'
import { freeGames, passGames } from '@/lib/games'
import { hasActivePass } from '@/lib/pass-entitlements'

export default async function PassPage({ searchParams }: { searchParams: Promise<{ checkout?: string; required?: string }> }) {
  const [{ checkout, required }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])
  const hasPass = session?.user ? await hasActivePass(session.user.id) : false
  const perks = [
    `${freeGames.length} complete games stay free, including multiplayer`,
    `${passGames.length} complete premium 3D campaigns`,
    'Boss-pattern combat, branching expeditions, and upgrade progression',
    'Manage or cancel the monthly membership in Stripe billing',
  ]
  const checkoutMessage = checkout === 'verified'
    ? hasPass ? 'Payment verified. Arcadia Pass is active on your account.' : 'Payment received; the subscription is not active yet. Refresh in a moment.'
    : checkout === 'cancelled' ? 'Checkout was cancelled. No subscription was started.'
      : checkout === 'verification-failed' ? 'We could not verify this checkout. Your account has not been given paid access.'
        : null

  return (
    <main className="min-h-screen bg-[#07101f] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">← Back to library</Link>
        {required ? <p className="mt-6 rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/[0.08] p-4 text-sm text-fuchsia-100">Arcadia Pass is required to play that campaign. Your free games remain available.</p> : null}
        {checkoutMessage ? <p className="mt-6 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] p-4 text-sm text-cyan-100" role="status">{checkoutMessage}</p> : null}
        <section className="mt-8 overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-300/15 via-white/[0.04] to-cyan-400/10 p-7 shadow-2xl shadow-fuchsia-950/20 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-fuchsia-200">Arcadia Pass</p>
          <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div><h1 className="max-w-2xl text-4xl font-black tracking-tight sm:text-6xl">Keep every free game. Go deeper.</h1><p className="mt-4 max-w-xl text-base leading-7 text-white/70">Arcadia Pass adds full premium campaigns with their own 3D worlds, combat systems, upgrades, and endings. The complete free library stays free for everyone.</p></div>
            <div className="rounded-3xl border border-white/15 bg-black/20 p-5 md:min-w-56">
              <p className="text-sm text-white/55">Monthly membership</p><p className="mt-1 text-4xl font-black">$2<span className="text-base font-medium text-white/50"> / month</span></p>
              {hasPass ? <><p className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-200">Pass active</p><PassBillingPortalButton /></> : session?.user ? <PassCheckoutButton /> : <Link href="/sign-in?next=%2Fpass" className="mt-4 block w-full rounded-xl bg-fuchsia-300 px-4 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-fuchsia-200">Sign in to unlock</Link>}
            </div>
          </div>
        </section>
        <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Arcadia Pass benefits">{perks.map((perk) => <div key={perk} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm font-semibold text-white/80">{perk}</div>)}</section>
        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Premium campaigns">
          {passGames.map((game) => <article key={game.slug} className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.045] p-5"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-200">Full premium campaign</p><h2 className="mt-2 text-xl font-black text-white">{game.title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{game.description}</p>{hasPass ? <Link href={`/play/${game.slug}`} className="mt-4 inline-flex rounded-lg bg-fuchsia-300 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-fuchsia-200">Play campaign</Link> : <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Included with Arcadia Pass</p>}</article>)}
        </section>
      </div>
    </main>
  )
}
