'use server'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getPassMembership, hasActivePass } from '@/lib/pass-entitlements'
import { PRODUCTS } from '@/lib/products'
import { stripe } from '@/lib/stripe'

function getTrustedOrigin() {
  const origin = process.env.BETTER_AUTH_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
    ?? process.env.V0_RUNTIME_URL
    ?? 'http://localhost:3000'
  return origin.replace(/\/$/, '')
}

export async function createPassCheckout(requestKey: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestKey)) throw new Error('Invalid checkout request')
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user) throw new Error('Sign in before starting Arcadia Pass')
  if (await hasActivePass(session.user.id)) throw new Error('Arcadia Pass is already active')

  const product = PRODUCTS.find((item) => item.id === 'arcadia-pass-monthly')
  if (!product) throw new Error('Pass product is unavailable')

  const origin = getTrustedOrigin()
  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ui_mode: 'hosted_page',
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: product.priceInCents,
          recurring: { interval: 'month' },
          product_data: {
            name: product.name,
            description: product.description,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/pass/confirm?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pass?checkout=cancelled`,
  }, { idempotencyKey: `arcadia-pass:${session.user.id}:${requestKey}` })

  if (!checkout.url) throw new Error('Stripe did not return a checkout URL')
  return checkout.url
}

export async function createPassBillingPortal() {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user) throw new Error('Sign in to manage Arcadia Pass')

  const membership = await getPassMembership(session.user.id)
  if (!membership) throw new Error('No Arcadia Pass membership was found')

  const portal = await stripe.billingPortal.sessions.create({
    customer: membership.stripeCustomerId,
    return_url: `${getTrustedOrigin()}/pass`,
  })
  return portal.url
}

const TIP_AMOUNTS_CENTS = [100, 200, 500, 1000, 1500, 2000, 2500, 5000, 7500, 10000] as const

export async function createTipCheckout(amountInCents: number) {
  if (!TIP_AMOUNTS_CENTS.includes(amountInCents as (typeof TIP_AMOUNTS_CENTS)[number])) {
    throw new Error("Choose one of the available tip amounts")
  }

  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin") ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const amount = amountInCents / 100
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "hosted_page",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: `Arcadia Play tip — $${amount.toFixed(2)}`,
            description: "A one-time tip to support Arcadia Play.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/?tip=thanks`,
    cancel_url: `${origin}/?tip=cancelled`,
  })

  if (!session.url) throw new Error("Stripe did not return a checkout URL")
  return session.url
}
