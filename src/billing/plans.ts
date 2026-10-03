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
