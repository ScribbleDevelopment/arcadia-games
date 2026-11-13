"use client"

import { useRef, useState, useTransition } from "react"
import { createPassCheckout } from "@/app/actions/stripe"

export function PassCheckoutButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const requestKey = useRef<string | null>(null)

  function beginCheckout() {
    requestKey.current ??= crypto.randomUUID()
    setError(null)
    startTransition(async () => {
      try {
        const url = await createPassCheckout(requestKey.current!)
        window.location.assign(url)
      } catch {
        setError("Checkout is temporarily unavailable. Please try again.")
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={beginCheckout}
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "Opening secure checkout…" : "Start Arcadia Pass"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p> : null}
    </div>
  )
}
