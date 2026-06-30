import { httpsCallable, HttpsCallableError } from 'firebase/functions';
import { functions } from '../config/firebase';

interface VerificationSession {
  sessionId: string;
  clientSecret: string;
}

interface VerificationStatus {
  success: boolean;
  verified: boolean;
  status: 'requires_input' | 'processing' | 'verified' | 'unverified';
  lastError?: string;
}

const createVerificationSessionFn = httpsCallable<
  Record<string, unknown>,
  VerificationSession
>(functions, 'createVerificationSession');

const checkVerificationStatusFn = httpsCallable<
  Record<string, unknown>,
  VerificationStatus
>(functions, 'checkVerificationStatus');

export async function createVerificationSession(): Promise<VerificationSession> {
  try {
    const result = await createVerificationSessionFn({});
    return result.data;
  } catch (error) {
    if (error instanceof HttpsCallableError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function checkVerificationStatus(): Promise<VerificationStatus> {
  try {
    const result = await checkVerificationStatusFn({});
    return result.data;
  } catch (error) {
    if (error instanceof HttpsCallableError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
