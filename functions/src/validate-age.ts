import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const validateUserAge = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const profileData = event.data?.data();

    const birthYear = profileData?.birthYear;
    if (!birthYear || typeof birthYear !== 'number') {
      throw new HttpsError(
        'invalid-argument',
        'birthYear is required and must be a number'
      );
    }

    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 18) {
      await event.data?.ref.delete();
      throw new HttpsError(
        'invalid-argument',
        'Users must be at least 18 years old'
      );
    }

    functions.logger.info(`User ${userId} age validated: ${age} years old`);
  }
);

export const preventEmailUpdate = onDocumentUpdated(
  'users/{userId}',
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (beforeData?.email !== afterData?.email) {
      throw new HttpsError(
        'permission-denied',
        'Email cannot be updated. It is managed by Firebase Authentication.'
      );
    }

    if (afterData?.age !== beforeData?.age) {
      throw new HttpsError(
        'permission-denied',
        'Age field cannot be updated directly. Age is calculated from birthYear.'
      );
    }

    if (afterData?.ageVerified && !beforeData?.ageVerified) {
      functions.logger.info(`User ${event.params.userId} marked as age verified`);
    }
  }
);

export const validateEmailFormat = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const profileData = event.data?.data();
    const email = profileData?.email;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await event.data?.ref.delete();
      throw new HttpsError(
        'invalid-argument',
        'Invalid email format'
      );
    }
  }
);
