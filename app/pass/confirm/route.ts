import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { passMemberships } from '@/lib/db/schema'
import { stripe } from '@/lib/stripe'

function redirectToPass(request: Request, state: string) {
  return NextResponse.redirect(new URL(`/pass?checkout=${state}`, request.url))
}

export async function GET(request: Request) {
  const checkoutSessionId = new URL(request.url).searchParams.get('session_id')
  const userSession = await auth.api.getSession({ headers: request.headers })
  if (!userSession?.user) {
    const next = checkoutSessionId ? `/pass/confirm?session_id=${encodeURIComponent(checkoutSessionId)}` : '/pass'
    return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url))
  }
  if (!checkoutSessionId) return redirectToPass(request, 'verification-failed')

  try {
    const checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId, { expand: ['subscription'] })
    const userId = userSession.user.id
    if (checkout.client_reference_id !== userId || checkout.metadata?.userId !== userId || checkout.mode !== 'subscription' || checkout.status !== 'complete') {
      return redirectToPass(request, 'verification-failed')
    }

    const subscription = typeof checkout.subscription === 'string'
      ? await stripe.subscriptions.retrieve(checkout.subscription)
      : checkout.subscription
    const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id
    if (!subscription || !customerId || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return redirectToPass(request, 'verification-failed')
    }

    await db.insert(passMemberships).values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    }).onConflictDoUpdate({
      target: passMemberships.userId,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      },
    })
  } catch {
    return redirectToPass(request, 'verification-failed')
  }

  return redirectToPass(request, 'verified')
}
