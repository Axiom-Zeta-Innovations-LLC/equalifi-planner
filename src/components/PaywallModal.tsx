import React from 'react';
import { X, Check, Crown, RefreshCw } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../billing/plans';
import type { SubscriptionState } from '../billing/useSubscription';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  sub: SubscriptionState;
  onNeedSignIn?: () => void;
}

function formatPrice(
  sub: SubscriptionState,
  itemId: string,
  fallback: string,
): string {
  const detail = sub.details[itemId];
  if (detail?.price) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: detail.price.currency,
      }).format(Number(detail.price.value));
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * EqualiF.I. Premium paywall.
 *
 * Two storefronts, one entitlement:
 * - Android app (TWA): Google Play Billing via the Digital Goods API.
 * - Web: Stripe Payment Links checkout; the Stripe webhook writes the
 *   entitlement to Firestore and this modal reads it back.
 * Premium unlocks the Dashboard, Scenarios, and Report.
 */
export default function PaywallModal({
  isOpen,
  onClose,
  sub,
  onNeedSignIn,
}: PaywallModalProps) {
  if (!isOpen) return null;

  const isStripe = sub.channel === 'stripe';
  const needsSignIn = isStripe && !sub.userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 print:hidden">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6" />
            <h2 className="text-xl font-black tracking-tight">EqualiF.I. Premium</h2>
          </div>
          <p className="text-sm text-white/85 mt-1">
            Unlock your full Financial Independence dashboard, scenario
            modeling, and printable report.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {sub.status === 'premium' ? (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">You&apos;re Premium.</p>
                <p className="text-sm text-emerald-800">
                  {isStripe
                    ? 'Your Stripe subscription is active. Manage or cancel it from the billing email receipt or by contacting us.'
                    : 'Your Google Play subscription is active. Manage or cancel it anytime in Google Play > Subscriptions.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.itemId}
                    className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-2 hover:border-emerald-400 transition-colors"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {plan.name}
                    </div>
                    <div className="text-2xl font-black text-zinc-900">
                      {formatPrice(sub, plan.itemId, plan.fallbackPrice)}
                      <span className="text-sm font-semibold text-zinc-500">
                        {plan.periodLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 flex-1">{plan.blurb}</p>
                    <button
                      type="button"
                      disabled={sub.purchasingItemId !== null}
                      onClick={() => {
                        if (needsSignIn && onNeedSignIn) {
                          onNeedSignIn();
                          return;
                        }
                        void sub.purchase(plan.itemId);
                      }}
                      className="mt-1 w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-emerald-700 transition-all cursor-pointer"
                    >
                      {sub.purchasingItemId === plan.itemId
                        ? 'Opening checkout…'
                        : needsSignIn
                          ? 'Sign in to subscribe'
                          : `Subscribe ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>

              {needsSignIn && (
                <p className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg p-3">
                  Create a free account first so your subscription attaches to
                  your planner. You&apos;ll come right back here to check out.
                </p>
              )}

              <button
                type="button"
                onClick={() => void sub.refresh()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore purchase
              </button>

              {sub.error && (
                <p className="text-xs text-red-600">{sub.error}</p>
              )}

              <p className="text-[11px] leading-relaxed text-zinc-500">
                {isStripe
                  ? 'Auto-renews until cancelled. Secure checkout by Stripe; manage or cancel anytime via your billing receipt. '
                  : 'Auto-renews until cancelled. Payment is charged to your Google Play account; manage or cancel anytime in Google Play subscriptions. '}
                EqualiF.I. Planner is an educational tool and does not provide
                individualized financial, tax, legal, or investment advice.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
