'use client'

import { useState, useTransition } from 'react'
import { createPassBillingPortal } from '@/app/actions/stripe'

export function PassBillingPortalButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function openPortal() {
    setError(null)
    startTransition(async () => {
      try {
        const url = await createPassBillingPortal()
        window.location.assign(url)
      } catch {
        setError('Billing management is temporarily unavailable. Please try again.')
      }
    })
  }

  return <div><button type="button" onClick={openPortal} disabled={isPending} className="mt-4 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white transition hover:border-cyan-300/50 disabled:cursor-wait disabled:opacity-60">{isPending ? 'Opening billing…' : 'Manage or cancel membership'}</button>{error ? <p className="mt-2 text-xs text-rose-200" role="alert">{error}</p> : null}</div>
}
