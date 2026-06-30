import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Validates user age when profile is created
 * Prevents creation of profiles for underage users
 */
export const validateUserAge = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const profileData = snap.data();

    const birthYear = profileData.birthYear;
    if (!birthYear || typeof birthYear !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'birthYear is required and must be a number'
      );
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 18) {
      await snap.ref.delete();
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Users must be at least 18 years old'
      );
    }

    functions.logger.info(`User ${userId} age validated: ${age} years old`);
  });

/**
 * Prevents updating email field (email is managed by Firebase Auth)
 */
export const preventEmailUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.email !== afterData.email) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Email cannot be updated. It is managed by Firebase Authentication.'
      );
    }

    if (afterData.age !== beforeData.age) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Age field cannot be updated directly. Age is calculated from birthYear.'
      );
    }

    if (afterData.ageVerified && !beforeData.ageVerified) {
      functions.logger.info(`User ${context.params.userId} marked as age verified`);
    }
  });

/**
 * Validates email format when profile is created
 */
export const validateEmailFormat = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap) => {
    const profileData = snap.data();
    const email = profileData.email;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await snap.ref.delete();
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email format'
      );
    }
  });
