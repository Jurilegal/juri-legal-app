import Stripe from 'stripe'

let stripe: Stripe | null = null

export function getStripeServer(): Stripe | null {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      console.warn('Stripe secret key not configured')
      return null
    }
    stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return stripe
}

export const PLATFORM_FEE_PERCENT = 5

export function calculateSessionCost(durationSeconds: number, minuteRateCents: number) {
  const minutes = Math.ceil(durationSeconds / 60)
  const totalCents = minutes * minuteRateCents
  const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_PERCENT / 100)
  return { totalCents, platformFeeCents, minutes }
}

// Pre-authorize a fixed amount (e.g. 60 min worth)
export const PRE_AUTH_MINUTES = 60
