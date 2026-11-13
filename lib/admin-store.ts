import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export type AdminRole = 'admin' | 'super_admin'

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS arcadia_admin_roles (email text PRIMARY KEY, role text NOT NULL CHECK (role IN ('admin', 'super_admin')), created_at timestamptz NOT NULL DEFAULT now())`)
}

export async function getAdminRole(email: string) {
  await ensureTable()
  const ownerEmail = process.env.OWNER_ADMIN_EMAIL?.toLowerCase()
  if (ownerEmail && email.toLowerCase() === ownerEmail) return 'super_admin' as const
  const result = await pool.query<{ role: AdminRole }>('SELECT role FROM arcadia_admin_roles WHERE lower(email) = lower($1)', [email])
  return result.rows[0]?.role ?? null
}

export async function listAdminRoles() {
  await ensureTable()
  const result = await pool.query<{ email: string; role: AdminRole; created_at: string }>('SELECT email, role, created_at FROM arcadia_admin_roles ORDER BY created_at DESC')
  const ownerEmail = process.env.OWNER_ADMIN_EMAIL
  return ownerEmail ? [{ email: ownerEmail, role: 'super_admin' as const, created_at: new Date(0).toISOString() }, ...result.rows.filter((row) => row.email.toLowerCase() !== ownerEmail.toLowerCase())] : result.rows
}

export async function setAdminRole(email: string, role: AdminRole) {
  await ensureTable()
  await pool.query('INSERT INTO arcadia_admin_roles (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role', [email.trim().toLowerCase(), role])
}

export async function removeAdminRole(email: string) {
  await ensureTable()
  await pool.query('DELETE FROM arcadia_admin_roles WHERE lower(email) = lower($1)', [email])
}
