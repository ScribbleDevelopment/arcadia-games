import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { pool } from '@/lib/auth'
import * as schema from './schema'

export const db = drizzle(pool, { schema })
