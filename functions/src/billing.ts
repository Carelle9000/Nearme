import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { google } from 'googleapis';
import { cert, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp(cert(process.env.FIREBASE_CONFIG as string ? JSON.parse(process.env.FIREBASE_CONFIG as string) : undefined));
const rtdb = getDatabase(app);

export const validateGooglePlayPurchase = onCall(
  { region: 'europe-west1', timeoutSeconds: 30 },
  async (request) => {
    try {
      const uid = request.auth?.uid;
      if (!uid) {
        throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
      }

      const { purchaseToken, productId } = request.data;

      if (!purchaseToken || !productId) {
        throw new HttpsError('invalid-argument', 'Paramètres manquants');
      }

      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const androidPublisher = google.androidpublisher({ version: 'v3', auth });

      const response = await androidPublisher.purchases.subscriptions.get({
        packageName: 'com.nearme.app',
        subscriptionId: productId,
        token: purchaseToken,
      });

      const subscription = response.data;

      if (!subscription) {
        throw new HttpsError('not-found', 'Achat non trouvé');
      }

      const paymentState = subscription.paymentState;
      const expiryTimeMillis = subscription.expiryTimeMillis;
      const autoRenewing = subscription.autoRenewing ?? true;
      const cancelledAtMillis = subscription.cancelledAtMillis;

      if (paymentState !== 1 && paymentState !== 2) {
        throw new HttpsError('invalid-argument', 'L\'achat n\'a pas été confirmé (état du paiement: ' + paymentState + ')');
      }

      if (cancelledAtMillis) {
        throw new HttpsError('invalid-argument', 'Cet abonnement a été annulé');
      }

      const now = new Date();
      const startDate = new Date(now.getTime()).toISOString();
      const expiryDate = new Date(Number(expiryTimeMillis)).toISOString();

      await rtdb.ref(`profiles/${uid}/premium`).set({
        isActive: true,
        tier: 'premium',
        startDate,
        expiryDate,
        autoRenew: autoRenewing,
        purchaseToken,
        productId,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Billing validation error:', error);
      throw new HttpsError('internal', error.message || 'Erreur lors de la validation du paiement');
    }
  }
);
