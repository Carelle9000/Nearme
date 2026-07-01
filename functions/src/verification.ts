import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { rtdb } from './firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const createVerificationSession = onCall(
  { region: 'europe-west1', cors: true },
  async (request) => {
    const { data, auth: context } = request;
    // Vérifier que l'utilisateur est authentifié
    if (!context) {
      throw new HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    try {
      const userEmail = context.token.email || '';
      const userId = context.uid;

      // Créer la session Stripe Identity
      const verification = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId,
          email: userEmail,
          timestamp: new Date().toISOString(),
        },
      });

      // Stocker la session dans Realtime Database
      await rtdb.ref(`profiles/${userId}`).update({
        verificationSessionId: verification.id,
        verificationStatus: 'pending',
        verificationCreatedAt: Date.now(),
      });

      // Créer un index verificationSessionId -> userId pour les webhooks
      await rtdb.ref(`verificationSessions/${verification.id}`).set({
        userId,
        createdAt: Date.now(),
      });

      console.log('Verification session created', {
        userId,
        sessionId: verification.id,
      });

      return {
        success: true,
        sessionId: verification.id,
        clientSecret: verification.client_secret,
      };
    } catch (error) {
      console.error('Error creating verification session:', error);
      throw new HttpsError(
        'internal',
        'Erreur lors de la création de la session'
      );
    }
  }
);

export const startIdentityVerification = onCall(
  { region: 'europe-west1', cors: true },
  async (request) => {
    const { data, auth: context } = request;
    if (!context) {
      throw new HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    try {
      const userId = context.uid;
      const userEmail = context.token.email || '';

      // Créer la session Stripe Identity
      const verification = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId,
          email: userEmail,
          timestamp: new Date().toISOString(),
        },
      });

      // Stocker la session dans Realtime Database
      const rtdb = admin.database();
      await rtdb.ref(`profiles/${userId}`).update({
        verificationSessionId: verification.id,
        verificationStatus: 'pending',
        verificationCreatedAt: Date.now(),
      });

      console.log('Verification session created', {
        userId,
        sessionId: verification.id,
      });

      return {
        status: 'verified',
        verificationId: verification.id,
        message: 'Vérification acceptée',
      };
    } catch (error) {
      console.error('Error starting verification:', error);
      throw new HttpsError(
        'internal',
        'Erreur lors du démarrage de la vérification'
      );
    }
  }
);

export const checkVerificationStatus = onCall(
  { region: 'europe-west1', cors: true },
  async (request) => {
    const { data, auth: context } = request;
    if (!context) {
      throw new HttpsError(
        'unauthenticated',
        'Utilisateur non authentifié'
      );
    }

    try {
      const userId = context.uid;

      // Récupérer le profil utilisateur
      const userSnapshot = await rtdb.ref(`profiles/${userId}`).get();
      const userData = userSnapshot.val();

      if (!userData || !userData.verificationSessionId) {
        throw new Error('Pas de session de vérification trouvée');
      }

      const sessionId = userData.verificationSessionId;

      // Récupérer le statut de la session Stripe
      const verification = await stripe.identity.verificationSessions.retrieve(
        sessionId
      );

      // Mettre à jour Realtime Database avec le résultat
      if (verification.status === 'verified') {
        const verifiedOutputs = verification.verified_outputs || {};
        const dob = (verifiedOutputs as any).dob?.date;
        const documentType = (verifiedOutputs as any).document?.type;

        await rtdb.ref(`profiles/${userId}`).update({
          ageVerified: true,
          verificationStatus: 'verified',
          verificationVerifiedAt: Date.now(),
          dateOfBirth: dob,
          documentType: documentType,
        });

        console.log('User verified', { userId });
      } else if (
        verification.status === 'requires_input' ||
        verification.status === 'processing'
      ) {
        await rtdb.ref(`profiles/${userId}`).update({
          verificationStatus: verification.status,
          verificationError: verification.last_error?.code,
        });

        console.warn('Verification pending', {
          userId,
          status: verification.status,
        });
      }

      return {
        success: true,
        verified: verification.status === 'verified',
        status: verification.status,
        lastError: verification.last_error?.code,
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      throw new HttpsError(
        'internal',
        'Erreur lors de la vérification du statut'
      );
    }
  }
);
