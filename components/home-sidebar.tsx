"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Gamepad2, House, LibraryBig, LogOut, Menu, ShieldCheck, UsersRound, X } from "lucide-react"
import { authClient } from "@/lib/auth-client"

const links = [
  { href: "/", label: "Home", icon: House, current: true },
  { href: "/#directory-heading", label: "Game library", icon: LibraryBig },
  { href: "/rooms", label: "Public rooms", icon: UsersRound },
  { href: "/pass", label: "Arcadia Pass", icon: Crown },
  { href: "/sigma", label: "Admin", icon: ShieldCheck },
]

export function HomeSidebar({ email }: { email: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSignOut() {
    setError("")
    setSigningOut(true)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError("Could not log out. Please try again.")
        setSigningOut(false)
        return
      }
      router.replace("/sign-in")
      router.refresh()
    } catch {
      setError("Could not log out. Please try again.")
      setSigningOut(false)
    }
  }

  function navigation(mobile = false) {
    return (
      <nav aria-label="Main navigation" className="space-y-1">
        {links.map(({ href, label, icon: Icon, current }) => (
          <Link
            key={label}
            href={href}
            onClick={() => mobile && setMenuOpen(false)}
            aria-current={current ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${current ? "bg-cyan-300/12 text-cyan-200" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
          >
            <Icon aria-hidden="true" className={`size-[18px] ${current ? "text-cyan-200" : "text-slate-500 group-hover:text-white"}`} />
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  function accountBlock() {
    return (
      <div className="border-t border-white/[0.08] pt-5">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-sm font-black text-cyan-100">
            {email.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p className="mt-1 truncate text-xs font-medium text-slate-300" title={email}>{email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-wait disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-[18px]" />
          {signingOut ? "Logging out…" : "Log out"}
        </button>
        {error ? <p role="alert" className="mt-2 px-3 text-xs text-rose-200">{error}</p> : null}
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.08] bg-slate-950/95 px-5 py-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.2em] text-white">
          <span className="flex size-8 items-center justify-center rounded-xl bg-cyan-300 text-slate-950"><Gamepad2 aria-hidden="true" className="size-4" /></span>
          Arcadia Play
        </Link>
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-home-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-10 items-center justify-center rounded-xl border border-white/10 text-slate-200 transition hover:border-cyan-200/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 cursor-default bg-black/70" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />
          <aside id="mobile-home-navigation" className="absolute inset-y-0 left-0 flex w-[min(19rem,88vw)] flex-col border-r border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50">
            <div className="mb-9 flex items-center justify-between">
              <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.2em] text-white">
                <span className="flex size-8 items-center justify-center rounded-xl bg-cyan-300 text-slate-950"><Gamepad2 aria-hidden="true" className="size-4" /></span>
                Arcadia Play
              </Link>
              <button type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><X aria-hidden="true" className="size-5" /></button>
            </div>
            {navigation(true)}
            <div className="mt-auto">{accountBlock()}</div>
          </aside>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-white/[0.08] bg-slate-950/90 px-5 py-7 lg:flex">
        <Link href="/" className="mb-12 flex items-center gap-3 px-2 text-sm font-black uppercase tracking-[0.2em] text-white">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30"><Gamepad2 aria-hidden="true" className="size-5" /></span>
          Arcadia Play
        </Link>
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600">Explore</p>
        {navigation()}
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.10] to-fuchsia-400/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Arcadia Pass</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">Support new games and multiplayer features for $2 a month.</p>
            <Link href="/pass" className="mt-3 inline-flex text-xs font-bold text-white transition hover:text-cyan-200">Explore the pass <span aria-hidden="true" className="ml-1">→</span></Link>
          </div>
          {accountBlock()}
        </div>
      </aside>
    </>
  )
}
