import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  push,
  Unsubscribe,
} from 'firebase/database';
import { firebaseApp } from '../config/firebase';

export const db = getDatabase(firebaseApp);

// ========== HELPER FUNCTIONS ==========

/**
 * Get a single value from the database
 */
export async function getValue(path: string) {
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.val();
  } catch (error) {
    console.error(`Error getting ${path}:`, error);
    throw error;
  }
}

/**
 * Set a value in the database (overwrites)
 */
export async function setValue(path: string, data: any) {
  try {
    await set(ref(db, path), data);
  } catch (error) {
    console.error(`Error setting ${path}:`, error);
    throw error;
  }
}

/**
 * Update a value in the database (merges)
 */
export async function updateValue(path: string, data: any) {
  try {
    await update(ref(db, path), data);
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    throw error;
  }
}

/**
 * Remove a value from the database
 */
export async function removeValue(path: string) {
  try {
    await remove(ref(db, path));
  } catch (error) {
    console.error(`Error removing ${path}:`, error);
    throw error;
  }
}

/**
 * Listen to real-time changes
 */
export function onValueChange(
  path: string,
  callback: (value: any) => void
): Unsubscribe {
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    callback(snapshot.val());
  });

  return unsubscribe;
}

/**
 * Push a new value (auto-generates key)
 */
export async function pushValue(path: string, data: any) {
  try {
    const newRef = push(ref(db, path));
    await set(newRef, data);
    return newRef.key;
  } catch (error) {
    console.error(`Error pushing to ${path}:`, error);
    throw error;
  }
}

export default db;
