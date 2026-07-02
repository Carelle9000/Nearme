import { httpsCallable } from 'firebase/functions';
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

// firebase/functions doesn't export a callable-specific Error class in v9+;
// errors surface as FirebaseError-shaped objects with { code, message, details }.
// We accept any Error and re-throw with its message.
function rethrowFunctionsError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(error.message);
  }
  throw error;
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
    rethrowFunctionsError(error);
  }
}

export async function checkVerificationStatus(): Promise<VerificationStatus> {
  try {
    const result = await checkVerificationStatusFn({});
    return result.data;
  } catch (error) {
    rethrowFunctionsError(error);
  }
}
