'use client'

import { FormEvent, useState } from "react"
import { authClient } from "@/lib/auth-client"

export function AuthForm({ mode, googleEnabled = false, callbackURL = '/' }: { mode: "sign-in" | "sign-up"; googleEnabled?: boolean; callbackURL?: string }) {
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function handleGoogleSignIn() {
    setError("")
    setPending(true)
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL })
      if (result.error) setError("Google sign-in is unavailable. Please try again later.")
    } catch {
      setError("Google sign-in is unavailable. Please try again later.")
    } finally {
      setPending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "").trim()
    const password = String(form.get("password") || "")
    const endpoint = mode === "sign-in" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email"

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "sign-up" ? { name: email.split("@")[0] } : {}),
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || result?.error) {
        setError("Unable to authenticate with those details.")
        return
      }
      window.location.href = callbackURL
    } catch {
      setError("The account service is unavailable. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={pending}>
      {googleEnabled ? (
        <>
          <button type="button" onClick={handleGoogleSignIn} disabled={pending} className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white px-4 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60">
            {pending ? "Connecting…" : "Continue with Google"}
          </button>
          <div className="flex items-center gap-3 text-xs text-white/40" aria-hidden="true"><span className="h-px flex-1 bg-white/10" /><span>OR CONTINUE WITH EMAIL</span><span className="h-px flex-1 bg-white/10" /></div>
        </>
      ) : null}
      <label className="block text-sm font-medium text-white/85">
        Email
        <input required name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" />
      </label>
      <label className="block text-sm font-medium text-white/85">
        Password
        <input required minLength={8} name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" />
      </label>
      {error && <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100" role="alert">{error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-2xl bg-cyan-300 px-4 py-3.5 font-semibold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">{pending ? "Connecting…" : mode === "sign-in" ? "Enter Arcadia" : "Create account"}</button>
    </form>
  )
}
