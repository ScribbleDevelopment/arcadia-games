import Link from "next/link"
import { AuthForm } from "@/components/auth-form"

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const callbackURL = next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : '/'

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Arcadia Play</p><h1 className="mb-2 text-3xl font-bold">Sign in to continue</h1><p className="mb-8 text-white/60">Your library and admin tools are protected by secure server sessions.</p><AuthForm mode="sign-in" googleEnabled callbackURL={callbackURL} /><div className="mt-6 space-y-3 text-center text-sm text-white/60"><p>New here? <Link className="text-cyan-300 underline" href={`/sign-up?next=${encodeURIComponent(callbackURL)}`}>Create an account</Link></p><Link className="block rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/10 px-4 py-3 font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/20" href="/admin-login">Admin login</Link></div></section></main>
}
