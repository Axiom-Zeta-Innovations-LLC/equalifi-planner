import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Stripe entitlement record written by the Stripe webhook
 * (api/stripe-webhook.ts) into Firestore at `entitlements/{firebaseUid}`.
 * Client code may only read its own record (see firestore.rules);
 * writes happen exclusively through the webhook's Admin SDK access.
 */
export interface StripeEntitlement {
  active: boolean;
  plan?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: string;
  updatedAt?: unknown;
}

export async function fetchStripeEntitlement(
  uid: string,
): Promise<StripeEntitlement | null> {
  try {
    const snap = await getDoc(doc(db, 'entitlements', uid));
    if (!snap.exists()) return null;
    return snap.data() as StripeEntitlement;
  } catch {
    return null;
  }
}
