'use client'

import { useEffect, useState } from 'react'

type Role = { email: string; role: 'admin' | 'super_admin'; created_at: string }

export function AdminRoleManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [message, setMessage] = useState('Loading roles…')

  async function refresh() {
    const response = await fetch('/api/admin/roles', { credentials: 'include' })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error ?? 'Unable to load roles.')
    setRoles(data.roles)
    setMessage('Role storage is active.')
  }

  useEffect(() => { refresh() }, [])

  async function updateRole(remove = false) {
    setMessage('Saving…')
    const response = await fetch('/api/admin/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, role, remove }) })
    const data = await response.json()
    if (!response.ok) return setMessage(data.error ?? 'Unable to save role.')
    setRoles(data.roles)
    setEmail('')
    setMessage(remove ? 'Admin removed.' : 'Role saved.')
  }

  return <div className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"><label className="sm:col-span-1"><span className="sr-only">Admin email</span><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="person@example.com" type="email" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none ring-cyan-300 placeholder:text-white/35 focus:ring-2" /></label><select value={role} onChange={(event) => setRole(event.target.value as 'admin' | 'super_admin')} className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white"><option value="admin">Admin</option><option value="super_admin">Super admin</option></select><button type="button" onClick={() => updateRole()} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200">Grant access</button></div><p className="text-sm text-white/55" role="status">{message}</p><div className="space-y-2">{roles.map((item) => <div key={item.email} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/15 px-4 py-3"><div><p className="text-sm font-semibold text-white">{item.email}</p><p className="text-xs uppercase tracking-widest text-cyan-200">{item.role.replace('_', ' ')}</p></div>{item.role !== 'super_admin' && <button type="button" onClick={() => { setEmail(item.email); updateRole(true) }} className="text-xs font-semibold text-rose-200 hover:text-rose-100">Remove</button>}</div>)}</div></div>
}
