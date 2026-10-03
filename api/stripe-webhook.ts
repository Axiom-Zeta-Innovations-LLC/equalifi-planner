/**
 * Stripe webhook → EqualiF.I. entitlement bridge.
 *
 * Flow: Stripe Payment Link checkout (with ?client_reference_id=<firebase
 * uid>) → checkout.session.completed → this endpoint writes
 * `entitlements/{uid}` in Firestore → the web app reads it and unlocks
 * Premium. customer.subscription.updated/deleted keeps it in sync.
 *
 * Env (set in Vercel project settings, never in code):
 * - STRIPE_WEBHOOK_SECRET        whsec_... for this endpoint
 * - FIREBASE_SERVICE_ACCOUNT_JSON  service account JSON (single line)
 *
 * Until both are set the endpoint answers 503 and checkout still works,
 * but entitlements will not be written (see docs/STRIPE_PAYWALL.md).
 */
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

function readRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(
  payload: Buffer,
  header: string | undefined,
  secret: string,
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const idx = kv.indexOf('=');
      return [kv.slice(0, idx).trim(), kv.slice(idx + 1).trim()];
    }),
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const signedPayload = `${timestamp}.${payload.toString('utf8')}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  // Imported lazily so a missing config yields a clean 503.
  const admin = await import('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(raw)),
    });
  }
  return admin.firestore();
}

async function upsertEntitlement(
  db: any,
  uid: string,
  fields: Record<string, unknown>,
) {
  await db
    .collection('entitlements')
    .doc(uid)
    .set({ ...fields, updatedAt: new Date().toISOString() }, { merge: true });
}

async function findUidBySubscription(db: any, subscriptionId: string) {
  const snap = await db
    .collection('entitlements')
    .where('stripeSubscriptionId', '==', subscriptionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    res.status(503).json({ error: 'stripe_bridge_not_configured' });
    return;
  }

  const payload = await readRawBody(req);
  const ok = verifyStripeSignature(
    payload,
    req.headers['stripe-signature'],
    webhookSecret,
  );
  if (!ok) {
    res.status(400).json({ error: 'invalid_signature' });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(payload.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  const db = await getFirestore();
  if (!db) {
    res.status(503).json({ error: 'firestore_not_configured' });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const uid: string | undefined = session.client_reference_id;
      if (uid && session.mode === 'subscription') {
        await upsertEntitlement(db, uid, {
          active: true,
          status: 'active',
          plan: session.metadata?.plan || 'monthly',
          stripeCustomerId: session.customer || null,
          stripeSubscriptionId: session.subscription || null,
        });
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object;
      const uid = await findUidBySubscription(db, subscription.id);
      if (uid) {
        const active =
          event.type !== 'customer.subscription.deleted' &&
          ['active', 'trialing', 'past_due'].includes(subscription.status);
        await upsertEntitlement(db, uid, {
          active,
          status: subscription.status,
          stripeCustomerId: subscription.customer || null,
          stripeSubscriptionId: subscription.id,
        });
      }
    }
  } catch (err) {
    // Acknowledge anyway to stop Stripe retries for app-level errors,
    // but surface failure in logs for follow-up.
    console.error('stripe webhook handling failed', err);
  }

  res.status(200).json({ received: true });
}
