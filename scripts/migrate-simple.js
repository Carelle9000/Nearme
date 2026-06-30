#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize with just cert
const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://nearme-bd95a.firebaseio.com'
});

// Get services from the app
const getFirestore = require('@firebase/firestore');
const getDatabase = require('@firebase/database');

const firebaseApp = require('firebase/app').getApp();

console.log('Testing initialization...');
console.log('App name:', app.name);
console.log('Database URL available');

console.log('\n✅ Firebase Admin SDK initialized');
console.log('Next: Use this to test data read\n');
