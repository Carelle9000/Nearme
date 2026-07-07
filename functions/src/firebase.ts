import * as admin from 'firebase-admin';

admin.initializeApp();

export const rtdb = admin.database();
export const auth = admin.auth();
