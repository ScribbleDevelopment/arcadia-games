import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { passMemberships } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

export async function getPassMembership(userId: string) {
  const [membership] = await db
    .select({ stripeCustomerId: passMemberships.stripeCustomerId, stripeSubscriptionId: passMemberships.stripeSubscriptionId })
    .from(passMemberships)
    .where(eq(passMemberships.userId, userId))
    .limit(1)

  return membership ?? null
}

export async function hasActivePass(userId: string) {
  const membership = await getPassMembership(userId)
  if (!membership) return false

  try {
    const subscription = await stripe.subscriptions.retrieve(membership.stripeSubscriptionId)
    return subscription.status === 'active' || subscription.status === 'trialing'
  } catch {
    return false
  }
}
