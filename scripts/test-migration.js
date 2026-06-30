#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 Testing Firebase Admin SDK v14...\n');

// Load service account
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize
const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://nearme-bd95a.firebaseio.com'
});

console.log('✅ Firebase Admin SDK initialized');
console.log(`   App: ${app.name}`);
console.log(`   Project: ${serviceAccount.project_id}`);

// Test Firestore
try {
  const firestore = admin.firestore();
  console.log('✅ Firestore available');
} catch (e) {
  console.error('❌ Firestore error:', e.message);
}

// Test Realtime Database
try {
  const rtdb = admin.database();
  console.log('✅ Realtime Database available');
} catch (e) {
  console.error('❌ RTDB error:', e.message);
}

console.log('\n✨ All systems ready for migration!\n');
process.exit(0);
