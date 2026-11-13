import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminRole, listAdminRoles, removeAdminRole, setAdminRole } from '@/lib/admin-store'

async function requireManager() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const role = await getAdminRole(session.user.email)
  return role === 'super_admin' ? session.user : null
}

export async function GET() {
  const manager = await requireManager()
  if (!manager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ roles: await listAdminRoles() })
}

export async function POST(request: Request) {
  const manager = await requireManager()
  if (!manager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await request.json() as { email?: string; role?: 'admin' | 'super_admin'; remove?: boolean }
  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (email === process.env.OWNER_ADMIN_EMAIL?.toLowerCase()) return NextResponse.json({ error: 'The owner role cannot be changed.' }, { status: 400 })
  if (body.remove) await removeAdminRole(email)
  else if (body.role) await setAdminRole(email, body.role)
  else return NextResponse.json({ error: 'Choose a role.' }, { status: 400 })
  return NextResponse.json({ roles: await listAdminRoles() })
}
