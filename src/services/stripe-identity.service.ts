import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { ref, update } from 'firebase/database';
import { rtdb } from '../config/firebase';

interface VerificationResult {
  status: 'verified' | 'requires_input' | 'failed';
  message?: string;
  verificationId?: string;
}

class StripeIdentityService {
  private simulationMode = true; // Toggle to false to use real Stripe verification

  async startVerification(file: any): Promise<VerificationResult> {
    // Simulation mode for testing
    if (this.simulationMode) {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing delay
      return {
        status: 'verified',
        message: 'Vérification simulée réussie',
        verificationId: 'sim_' + Math.random().toString(36).substr(2, 9),
      };
    }

    try {
      const startVerification = httpsCallable<
        { fileName: string; fileData: string },
        VerificationResult
      >(functions, 'startIdentityVerification');

      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const result = await startVerification({
              fileName: file.name || 'document',
              fileData: base64Data,
            });

            resolve(result.data);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        if (file.uri) {
          // Mobile file
          fetch(file.uri)
            .then((res) => res.blob())
            .then((blob) => {
              const fileReader = new FileReader();
              fileReader.onload = () => {
                const base64 = fileReader.result as string;
                startVerification({
                  fileName: file.name || 'document',
                  fileData: base64,
                }).then((result) => resolve(result.data));
              };
              fileReader.readAsDataURL(blob);
            });
        } else {
          // Web file
          reader.readAsDataURL(file);
        }
      });
    } catch (error) {
      console.error('Error starting verification:', error);
      return {
        status: 'failed',
        message: 'Erreur lors de la vérification',
      };
    }
  }

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
        await update(ref(rtdb, `profiles/${userId}`), {
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
