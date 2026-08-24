import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Must match the version the installed SDK is generated against — stripe-node
  // types `apiVersion` as the single literal it pins, so this is a compile error
  // whenever the package is bumped without updating it here.
  apiVersion: '2026-06-24.dahlia',
})
