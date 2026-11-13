import Link from "next/link"
import { AuthForm } from "@/components/auth-form"

export default function AdminLoginPage() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white"><section className="w-full max-w-md rounded-3xl border border-fuchsia-300/20 bg-white/5 p-8 shadow-2xl shadow-fuchsia-950/20"><p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-200">Arcadia command access</p><h1 className="mb-2 text-3xl font-bold">Admin login</h1><p className="mb-8 text-white/60">Sign in with an authorized account. The server verifies access before opening /sigma.</p><AuthForm mode="sign-in" /><Link className="mt-6 block text-center text-sm text-cyan-300 underline" href="/sign-in">Back to member login</Link></section></main>
}
