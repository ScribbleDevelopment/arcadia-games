import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminRoleManager } from "@/components/admin-role-manager"

const OWNER_EMAIL = process.env.OWNER_ADMIN_EMAIL

export default async function SigmaPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")
  if (!OWNER_EMAIL || session.user.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) redirect("/")

  return (
    <main className="min-h-screen bg-[#07101f] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-cyan-300/15 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Owner console · /sigma</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Arcadia command center</h1>
            <p className="mt-2 text-sm text-white/55">Signed in as {session.user.email}. Owner access is server-verified.</p>
          </div>
          <a href="/" className="rounded-xl border border-white/15 px-4 py-2 text-center text-sm font-semibold transition hover:border-cyan-300/50 hover:text-cyan-200">Back to library</a>
        </header>
        <section aria-label="Arcadia statistics" className="grid gap-4 sm:grid-cols-3">
          {[['200+', 'Free games'], ['800', 'Pass games'], ['100', 'Admin-enabled titles']].map(([value, label]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
              <p className="text-3xl font-black text-cyan-200">{value}</p>
              <p className="mt-1 text-sm text-white/60">{label}</p>
            </article>
          ))}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.045] p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Access control</p><h2 className="mt-2 text-xl font-bold">Admin hierarchy</h2></div><span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200">Owner</span></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 p-4"><p className="font-semibold">Super admins</p><p className="mt-1 text-xs text-white/55">Can promote or remove admins.</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="font-semibold">Admins</p><p className="mt-1 text-xs text-white/55">Can manage assigned games.</p></div><div className="rounded-2xl border border-white/10 p-4"><p className="font-semibold">Members</p><p className="mt-1 text-xs text-white/55">Can play and manage their pass.</p></div></div>
            <AdminRoleManager />
          </article>
          <article className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.07] p-6"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">Owner setup</p><h2 className="mt-2 text-xl font-bold">Secure credentials</h2><p className="mt-3 text-sm leading-6 text-white/65">The owner email and password are read only on the server. They are never placed in client JavaScript or the page HTML.</p><div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm"><p className="text-white/50">Owner email</p><p className="mt-1 font-semibold">{OWNER_EMAIL}</p></div></article>
        </section>
      </div>
    </main>
  )
}
