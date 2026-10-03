import React from 'react';
import {
  PLAY_BILLING_SERVICE_URL,
  PLAN_ITEM_IDS,
  STRIPE_PAYMENT_LINKS,
  SUBSCRIPTION_PLANS,
} from './plans';
import type {
  DigitalGoodsItemDetails,
  DigitalGoodsService,
} from './digital-goods.d';
import { auth, onAuthStateChanged } from '../firebase';
import { fetchStripeEntitlement } from './stripeEntitlement';

export type SubscriptionStatus =
  | 'loading' // checking environment / purchases
  | 'unavailable' // no billing environment resolved yet (transient)
  | 'free' // billable environment, no active subscription
  | 'premium'; // active subscription found

export type BillingChannel = 'play' | 'stripe' | null;

export interface SubscriptionState {
  status: SubscriptionStatus;
  channel: BillingChannel;
  userId: string | null;
  details: Record<string, DigitalGoodsItemDetails>;
  purchasingItemId: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  purchase: (itemId: string) => Promise<boolean>;
  /** Builds the Stripe Payment Link checkout URL (web channel). */
  stripeCheckoutUrl: (itemId: string) => string | null;
}

/**
 * Subscription entitlement across both storefronts.
 *
 * - Android app (TWA): Google Play Billing via the Digital Goods API.
 *   Premium when listPurchases() shows an active purchase of one of
 *   PLAN_ITEM_IDS.
 * - Web: Stripe paywall. Premium when the signed-in user's Firestore
 *   entitlement (`entitlements/{uid}`, written by the Stripe webhook)
 *   is active. Checkout runs through Stripe Payment Links with
 *   ?client_reference_id=<uid> so the webhook can attach the purchase.
 *
 * Premium unlocks Dashboard / Scenarios / Report (steps 9-11) in both
 * channels; the assessment (steps 1-8) stays open.
 *
 * Production hardening: Play purchases are client-checked (standard
 * TWA v1); the Stripe path is webhook-verified server-side.
 */
export function useSubscription(): SubscriptionState {
  const [status, setStatus] = React.useState<SubscriptionStatus>('loading');
  const [channel, setChannel] = React.useState<BillingChannel>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState<
    Record<string, DigitalGoodsItemDetails>
  >({});
  const [purchasingItemId, setPurchasingItemId] = React.useState<string | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const serviceRef = React.useRef<DigitalGoodsService | null>(null);

  const getService = React.useCallback(async () => {
    if (serviceRef.current) return serviceRef.current;
    if (typeof window === 'undefined' || !window.getDigitalGoodsService) {
      return null;
    }
    const service = await window.getDigitalGoodsService(
      PLAY_BILLING_SERVICE_URL,
    );
    serviceRef.current = service;
    return service;
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      const service = await getService();
      if (service) {
        setChannel('play');
        const purchases = await service.listPurchases();
        const entitled = purchases.some((p) =>
          PLAN_ITEM_IDS.includes(p.itemId),
        );
        setStatus(entitled ? 'premium' : 'free');
        try {
          const items = await service.getDetails(PLAN_ITEM_IDS);
          const map: Record<string, DigitalGoodsItemDetails> = {};
          for (const item of items) map[item.itemId] = item;
          setDetails(map);
        } catch {
          // Price display falls back to the configured USD prices.
        }
        return;
      }
      // Web channel: Stripe entitlement for the signed-in user.
      setChannel('stripe');
      const user = auth.currentUser;
      setUserId(user?.uid ?? null);
      if (!user) {
        setStatus('free');
        return;
      }
      const entitlement = await fetchStripeEntitlement(user.uid);
      setStatus(entitlement?.active ? 'premium' : 'free');
    } catch (err) {
      setStatus('free');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [getService]);

  React.useEffect(() => {
    void refresh();
    const unsub = onAuthStateChanged(auth, () => {
      void refresh();
    });
    return () => unsub();
  }, [refresh]);

  const stripeCheckoutUrl = React.useCallback(
    (itemId: string) => {
      const base = STRIPE_PAYMENT_LINKS[itemId];
      if (!base) return null;
      const uid = auth.currentUser?.uid;
      if (!uid) return base;
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}client_reference_id=${encodeURIComponent(uid)}`;
    },
    [],
  );

  const purchase = React.useCallback(
    async (itemId: string) => {
      const service = await getService();
      if (!service) {
        // Web: hand off to Stripe Checkout (Payment Link).
        const url = stripeCheckoutUrl(itemId);
        if (url) {
          window.location.href = url;
          return true;
        }
        setError('Checkout is not configured for this plan yet.');
        return false;
      }
      setPurchasingItemId(itemId);
      setError(null);
      try {
        const plan = SUBSCRIPTION_PLANS.find((p) => p.itemId === itemId);
        const request = new PaymentRequest(
          [
            {
              supportedMethods: PLAY_BILLING_SERVICE_URL,
              data: { sku: itemId },
            },
          ],
          {
            total: {
              label: plan ? `EqualiF.I. Planner ${plan.name}` : 'EqualiF.I. Planner',
              amount: { currency: 'USD', value: '0' },
            },
          },
        );
        const response = await request.show();
        await response.complete('success');

        // Confirm entitlement and acknowledge so Play does not auto-refund.
        const purchases = await service.listPurchases();
        const match = purchases.find((p) => p.itemId === itemId);
        if (match && service.acknowledge) {
          try {
            await service.acknowledge(match.purchaseToken, 'subscription');
          } catch {
            // Server-side acknowledgement remains the fallback; see docs.
          }
        }
        const entitled = purchases.some((p) =>
          PLAN_ITEM_IDS.includes(p.itemId),
        );
        setStatus(entitled ? 'premium' : 'free');
        return entitled;
      } catch (err) {
        // User cancelling the Play purchase sheet lands here; that is not
        // an app error worth alarming about.
        setError(
          err instanceof Error ? err.message : 'Purchase was not completed.',
        );
        await refresh();
        return false;
      } finally {
        setPurchasingItemId(null);
      }
    },
    [getService, refresh, stripeCheckoutUrl],
  );

  return {
    status,
    channel,
    userId,
    details,
    purchasingItemId,
    error,
    refresh,
    purchase,
    stripeCheckoutUrl,
  };
}
