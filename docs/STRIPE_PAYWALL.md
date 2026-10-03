# EqualiF.I. Planner — Stripe Paywall (Web)

Live in Stripe (Axiom Zeta Innovations account, created 2026-10-03):

- Product: **EqualiF.I. Planner Premium** — `prod_VNLFaA3zX0ieLq`
- Monthly: `price_1UMaZBRuE1b4AX4JBl59Gzg9` — $15.99/mo —
  https://buy.stripe.com/14AaEZ2ScaR96Am2OJ18c0e
- Yearly: `price_1UMaZCRuE1b4AX4JDfD6Xgz5` — $100.99/yr —
  https://buy.stripe.com/28E9AV8cw0cv7Eqahb18c0f

## How it works

1. Web app paywall (`src/components/PaywallModal.tsx`) sends signed-in
   users to the Stripe Payment Link with
   `?client_reference_id=<firebase uid>` appended.
2. Stripe redirects back to
   `https://equalifi-planner.vercel.app/?checkout=success&plan=monthly|yearly`.
3. Stripe calls `POST /api/stripe-webhook` (Vercel serverless,
   `api/stripe-webhook.ts`), which verifies the signature and writes
   `entitlements/{uid}` in Firestore.
4. The app reads its own entitlement doc (`firestore.rules`: owner-read,
   no client writes) and unlocks Premium (steps 9–11).
5. `customer.subscription.updated/deleted` events keep the doc in sync
   (deleted → inactive; past_due stays active as a grace period).

Google Play channel is separate: inside the Android app the same
paywall sells through Play Billing (Digital Goods API), per Google's
policy. See docs/GOOGLE_PLAY_RELEASE.md.

## Activation checklist (one-time)

Until steps 1–3 are done, the webhook answers 503 and checkouts will
not unlock Premium (checkout itself still works).

1. **Stripe webhook endpoint**: Stripe Dashboard → Developers →
   Webhooks → Add endpoint:
   - URL: `https://equalifi-planner.vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`,
     `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the endpoint's Signing secret (`whsec_...`).
2. **Firebase service account**: Firebase Console → project
   `electric-attic-472817-t2` → Project settings → Service accounts →
   Generate new private key (downloads a JSON file).
3. **Vercel env** (project `equalifi-planner`, Production):
   - `STRIPE_WEBHOOK_SECRET` = the `whsec_...` from step 1
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = the full JSON from step 2,
     pasted as a single line
   Then redeploy (any push to main, or Deployments → Redeploy).
4. **Firestore rules**: publish the updated `firestore.rules`
   (adds the `entitlements/{uid}` owner-read rule) in Firebase Console →
   Firestore Database → Rules.
5. Test: sign in on the web app, subscribe with a Stripe test flow or a
   real card, confirm `entitlements/{uid}` appears and the paywall
   flips to Premium after returning.

## Notes

- Prices/IDs in code: `src/billing/plans.ts`
  (`STRIPE_PAYMENT_LINKS`, overridable via `VITE_STRIPE_LINK_*` env).
- Guests must create an account before checkout so the subscription
  attaches to their planner; the paywall enforces this.
- Refunds/charges are managed in the Stripe Dashboard; cancelling in
  Stripe flips entitlement off via the subscription.deleted event.
