import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { db } from './firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const stripeWebhook = onRequest(
  { region: 'europe-west1', cors: true },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
      // Construire l'événement Stripe
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      res.status(400).send(`Webhook Error: ${(error as Error).message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'identity.verification_session.verified': {
          const session = event.data.object as Stripe.Identity.VerificationSession;

          // Trouver l'utilisateur par session ID
          const usersSnapshot = await db
            .collection('users')
            .where('verificationSessionId', '==', session.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userId = usersSnapshot.docs[0].id;
            const verifiedOutputs = session.verified_outputs || {};

            await db.collection('users').doc(userId).update({
              ageVerified: true,
              verificationStatus: 'verified',
              verificationVerifiedAt:
                admin.firestore.FieldValue.serverTimestamp(),
              dateOfBirth: (verifiedOutputs as any).dob?.date,
              documentType: (verifiedOutputs as any).document?.type,
            });

            console.log('User verified via webhook', { userId });
          }

          break;
        }

        case 'identity.verification_session.canceled': {
          const session = event.data.object as Stripe.Identity.VerificationSession;

          const usersSnapshot = await db
            .collection('users')
            .where('verificationSessionId', '==', session.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userId = usersSnapshot.docs[0].id;

            await db.collection('users').doc(userId).update({
              verificationStatus: 'canceled',
            });

            console.log('Verification canceled', { userId });
          }

          break;
        }

        case 'identity.verification_session.requires_input': {
          const session = event.data.object as Stripe.Identity.VerificationSession;

          const usersSnapshot = await db
            .collection('users')
            .where('verificationSessionId', '==', session.id)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userId = usersSnapshot.docs[0].id;

            await db.collection('users').doc(userId).update({
              verificationStatus: 'requires_input',
              verificationError:
                session.last_error?.code || 'unknown_error',
            });

            console.warn('Verification requires input', { userId });
          }

          break;
        }

        default:
          console.log('Unhandled event type:', event.type);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
