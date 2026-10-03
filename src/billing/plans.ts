/**
 * Google Play subscription catalogue for EqualiF.I. Planner.
 *
 * These itemIds MUST match the subscription product IDs created in
 * Google Play Console (Monetize > Subscriptions). Prices are set in
 * Play Console per country; the USD fallbacks below are only used for
 * display when the Digital Goods API cannot return a localized price
 * (e.g. when running on the open web, outside the Android app).
 *
 * Pricing decided 2026-10-03: $15.99/month, $100.99/year (USD base).
 */
export interface PlanDef {
  itemId: string;
  name: string;
  periodLabel: string;
  fallbackPrice: string;
  blurb: string;
}

export const SUBSCRIPTION_PLANS: PlanDef[] = [
  {
    itemId: 'equalifi_monthly',
    name: 'Monthly',
    periodLabel: '/month',
    fallbackPrice: '$15.99',
    blurb: 'Full planner, billed monthly. Cancel anytime in Google Play.',
  },
  {
    itemId: 'equalifi_yearly',
    name: 'Yearly',
    periodLabel: '/year',
    fallbackPrice: '$100.99',
    blurb: 'Full planner, billed yearly — about 47% less than monthly.',
  },
];

export const PLAN_ITEM_IDS = SUBSCRIPTION_PLANS.map((p) => p.itemId);

/** Google Play Billing service provider URL for the Digital Goods API. */
export const PLAY_BILLING_SERVICE_URL = 'https://play.google.com/billing';

/**
 * Stripe paywall (web). Live Payment Links created 2026-10-03 in the
 * Axiom Zeta Innovations Stripe account for product
 * "EqualiF.I. Planner Premium" (prod_VNLFaA3zX0ieLq):
 * - monthly price_1UMaZBRuE1b4AX4JBl59Gzg9 ($15.99/mo)
 * - yearly  price_1UMaZCRuE1b4AX4JDfD6Xgz5 ($100.99/yr)
 * Override with VITE_STRIPE_LINK_MONTHLY / VITE_STRIPE_LINK_YEARLY.
 * At checkout the app appends ?client_reference_id=<firebase uid> so the
 * Stripe webhook can attach the subscription to the user's account
 * (see docs/STRIPE_PAYWALL.md).
 */
export const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  equalifi_monthly:
    import.meta.env.VITE_STRIPE_LINK_MONTHLY ||
    'https://buy.stripe.com/14AaEZ2ScaR96Am2OJ18c0e',
  equalifi_yearly:
    import.meta.env.VITE_STRIPE_LINK_YEARLY ||
    'https://buy.stripe.com/28E9AV8cw0cv7Eqahb18c0f',
};
