import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

class StripeIdentityService {
  async createVerificationSession(userId: string): Promise<string | null> {
    try {
      const createSession = httpsCallable(
        functions,
        'createStripeIdentitySession'
      );
      const result = await createSession({ userId });
      return (result.data as any).clientSecret;
    } catch (error) {
      console.error('Error creating verification session:', error);
      throw error;
    }
  }

  async verifyIdentity(userId: string, sessionId: string): Promise<boolean> {
    try {
      const verifyIdentity = httpsCallable(functions, 'verifyIdentity');
      const result = await verifyIdentity({ userId, sessionId });
      const isVerified = (result.data as any).verified;

      if (isVerified) {
        await updateDoc(doc(db, 'profiles', userId), {
          isAgeVerified: true,
          stripeIdentitySessionId: sessionId,
        });
      }

      return isVerified;
    } catch (error) {
      console.error('Error verifying identity:', error);
      throw error;
    }
  }

  async checkVerificationStatus(userId: string): Promise<boolean> {
    try {
      const checkStatus = httpsCallable(functions, 'checkVerificationStatus');
      const result = await checkStatus({ userId });
      return (result.data as any).verified;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  }
}

export const stripeIdentityService = new StripeIdentityService();
