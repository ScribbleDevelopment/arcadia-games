import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { GameDirectory } from "@/components/game-directory"
import { HomeSidebar } from "@/components/home-sidebar"
import { TipJar } from "@/components/tip-jar"
import { hasActivePass } from '@/lib/pass-entitlements'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  const hasPass = await hasActivePass(session.user.id)

  return (
    <main className="min-h-screen bg-slate-950 text-white lg:flex">
      <HomeSidebar email={session.user.email} />
      <div className="min-w-0 flex-1 px-5 pb-12 pt-7 sm:px-8 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-6xl">
          <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-400/15 via-white/[.04] to-fuchsia-500/10 p-7 sm:p-12">
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Welcome back</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Play the good ones.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/60 sm:text-lg">A complete free library for everyone, plus deeper 3D campaigns for Arcadia Pass members. Every game has its own rules and a real win condition.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/75">12 complete free games</span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/75">3 multiplayer modes</span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/75">Free to play</span>
              </div>
            </div>
          </section>
          <div className="mt-12 space-y-14">
            <GameDirectory hasPass={hasPass} />
            <TipJar />
          </div>
        </div>
      </div>
    </main>
  )
}
