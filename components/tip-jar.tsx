"use client"

import { useState, useTransition } from "react"
import { Heart, LoaderCircle } from "lucide-react"
import { createTipCheckout } from "@/app/actions/stripe"

const amounts = [
  { cents: 100, label: "$1" },
  { cents: 200, label: "$2" },
  { cents: 500, label: "$5" },
  { cents: 1000, label: "$10" },
  { cents: 1500, label: "$15" },
  { cents: 2000, label: "$20" },
  { cents: 2500, label: "$25" },
  { cents: 5000, label: "$50" },
  { cents: 7500, label: "$75" },
  { cents: 10000, label: "$100" },
]

export function TipJar() {
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function tip(amountInCents: number) {
    setError(null)
    setPendingAmount(amountInCents)
    startTransition(async () => {
      try {
        const url = await createTipCheckout(amountInCents)
        window.location.assign(url)
      } catch {
        setError("Checkout is unavailable right now. Please try again.")
        setPendingAmount(null)
      }
    })
  }

  return (
    <section aria-labelledby="tip-jar-title" className="mt-10 overflow-hidden rounded-[2rem] border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-400/[.09] via-white/[.025] to-cyan-300/[.07] p-6 sm:p-9">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-fuchsia-300/10 text-fuchsia-200">
            <Heart aria-hidden="true" className="size-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200/80">Keep the games coming</p>
          <h2 id="tip-jar-title" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">Drop a tip in the jar</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Enjoying Arcadia? Every tip helps us keep the games playable and the rooms running. One-time, secure checkout.</p>
        </div>
        <p className="text-xs font-medium text-white/40">Choose an amount · USD</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {amounts.map(({ cents, label }) => (
          <button
            key={cents}
            type="button"
            onClick={() => tip(cents)}
            disabled={isPending}
            aria-label={`Tip ${label}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200 disabled:cursor-wait disabled:opacity-60"
          >
            {isPending && pendingAmount === cents ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {isPending && pendingAmount === cents ? "Opening…" : label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-rose-200" role="alert">{error}</p> : null}
    </section>
  )
}
