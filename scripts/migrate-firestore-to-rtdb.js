#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found at', serviceAccountPath);
  console.error('Please set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in project root');
  process.exit(1);
}

let db, firestore;

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

  if (admin.getApps().length === 0) {
    admin.initializeApp({
      credential: admin.cert(serviceAccount),
      databaseURL: 'https://nearme-bd95a.firebaseio.com'
    });
  }

  db = admin.database();
  firestore = admin.firestore();

  console.log('✅ Firebase Admin initialized successfully\n');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

console.log('\n🚀 Starting Firestore to Realtime Database Migration...\n');

// ========== HELPER FUNCTIONS ==========

async function migrateProfiles() {
  console.log('📥 Migrating profiles...');
  try {
    const snapshot = await firestore.collection('profiles').get();
    const profiles = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      profiles[doc.id] = {
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.name || '',
        photoUrl: data.photoUrl || '',
        bio: data.bio || '',
        gender: data.gender || '',
        birthDate: data.birthDate || '',
        interests: data.interests || [],
        location: data.location || null,
        photos: data.photos || [],
        isAgeVerified: data.isAgeVerified || false,
        verified: data.verified || false,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
        lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
        verificationSessionId: data.verificationSessionId || '',
        verificationStatus: data.verificationStatus || '',
        sent_likes: {},
        received_likes: {},
        nopes: {},
        favorites: {},
        notifications: {}
      };
    });

    await db.ref('profiles').set(profiles);
    console.log('✅ Profiles migrated:', Object.keys(profiles).length);
    return profiles;
  } catch (error) {
    console.error('❌ Error migrating profiles:', error.message);
    throw error;
  }
}

async function migrateMatches() {
  console.log('📥 Migrating matches...');
  try {
    const snapshot = await firestore.collection('matches').get();
    const matches = {};

    for (const doc of snapshot.docs) {
      const matchData = doc.data();
      const messages = {};

      const messagesSnapshot = await doc.ref.collection('messages').get();
      messagesSnapshot.forEach(msgDoc => {
        const msgData = msgDoc.data();
        messages[msgDoc.id] = {
          senderId: msgData.senderId || '',
          content: msgData.content || '',
          type: msgData.type || 'text',
          sentAt: msgData.createdAt?.toMillis?.() || msgData.sentAt?.toMillis?.() || Date.now(),
          status: msgData.status || 'sent',
          readAt: msgData.readAt?.toMillis?.() || null,
          deliveredAt: msgData.deliveredAt?.toMillis?.() || null
        };
      });

      matches[doc.id] = {
        userId1: matchData.users?.[0] || matchData.userId1 || '',
        userId2: matchData.users?.[1] || matchData.userId2 || '',
        users: matchData.users || [matchData.userId1, matchData.userId2],
        matchedAt: matchData.matchedAt?.toMillis?.() || Date.now(),
        lastInteractionAt: matchData.lastInteractionAt?.toMillis?.() || Date.now(),
        messages: messages
      };
    }

    await db.ref('matches').set(matches);
    console.log('✅ Matches migrated:', Object.keys(matches).length);
    return matches;
  } catch (error) {
    console.error('❌ Error migrating matches:', error.message);
    throw error;
  }
}

async function migrateUsers() {
  console.log('📥 Migrating users...');
  try {
    const snapshot = await firestore.collection('users').get();
    const users = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      users[doc.id] = {
        email: data.email || '',
        displayName: data.displayName || data.name || '',
        photoUrl: data.photoUrl || '',
        bio: data.bio || '',
        gender: data.gender || '',
        birthDate: data.birthDate || '',
        interests: data.interests || [],
        location: data.location || null,
        isAgeVerified: data.isAgeVerified || false,
        verified: data.verified || false,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
        lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
        verificationSessionId: data.verificationSessionId || '',
        verificationStatus: data.verificationStatus || ''
      };
    });

    if (Object.keys(users).length > 0) {
      await db.ref('users').set(users);
      console.log('✅ Users migrated:', Object.keys(users).length);
    } else {
      console.log('⚠️  No users found to migrate');
    }
    return users;
  } catch (error) {
    console.error('❌ Error migrating users:', error.message);
    throw error;
  }
}

async function migrateLikes() {
  console.log('📥 Migrating likes from profiles...');
  try {
    const snapshot = await firestore.collection('profiles').get();
    let totalLikes = 0;

    for (const profileDoc of snapshot.docs) {
      const userId = profileDoc.id;

      const sentLikesSnapshot = await profileDoc.ref.collection('sent_likes').get();
      const sentLikes = {};
      sentLikesSnapshot.forEach(doc => {
        sentLikes[doc.id] = {
          createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
          targetId: doc.id
        };
      });

      if (Object.keys(sentLikes).length > 0) {
        await db.ref(`profiles/${userId}/sent_likes`).set(sentLikes);
        totalLikes += Object.keys(sentLikes).length;
      }
    }

    console.log('✅ Sent likes migrated:', totalLikes);
  } catch (error) {
    console.error('❌ Error migrating likes:', error.message);
    throw error;
  }
}

async function migrateBlocks() {
  console.log('📥 Migrating blocks...');
  try {
    const snapshot = await firestore.collection('blocks').get();
    const blocks = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      blocks[doc.id] = {
        blockerId: data.blockerId || '',
        blockedId: data.blockedId || '',
        createdAt: data.createdAt?.toMillis?.() || Date.now()
      };
    });

    if (Object.keys(blocks).length > 0) {
      await db.ref('blocks').set(blocks);
      console.log('✅ Blocks migrated:', Object.keys(blocks).length);
    } else {
      console.log('⚠️  No blocks found to migrate');
    }
    return blocks;
  } catch (error) {
    console.error('❌ Error migrating blocks:', error.message);
    throw error;
  }
}

async function migrateSharedSpots() {
  console.log('📥 Migrating shared spots...');
  try {
    const snapshot = await firestore.collection('sharedSpots').get();
    const spots = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      spots[doc.id] = {
        userId: data.userId || '',
        name: data.name || '',
        location: data.location || null,
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || Date.now()
      };
    });

    if (Object.keys(spots).length > 0) {
      await db.ref('sharedSpots').set(spots);
      console.log('✅ Shared spots migrated:', Object.keys(spots).length);
    } else {
      console.log('⚠️  No shared spots found to migrate');
    }
    return spots;
  } catch (error) {
    console.error('⚠️  Warning - Shared spots migration skipped:', error.message);
  }
}

// ========== MAIN MIGRATION ==========

async function runMigration() {
  const startTime = Date.now();

  try {
    console.log('📋 Migration Plan:');
    console.log('  1. Migrate users');
    console.log('  2. Migrate profiles');
    console.log('  3. Migrate matches with messages');
    console.log('  4. Migrate sent likes');
    console.log('  5. Migrate blocks');
    console.log('  6. Migrate shared spots\n');

    await migrateUsers();
    await migrateProfiles();
    await migrateMatches();
    await migrateLikes();
    await migrateBlocks();
    await migrateSharedSpots();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('\n📍 Data is now in Realtime Database');
    console.log('   https://console.firebase.google.com/project/nearme-bd95a/database');
    console.log('\n✨ Next steps:');
    console.log('   1. ✅ Verify data in Firebase Console');
    console.log('   2. ⏳ Update remaining services (match, chat, block)');
    console.log('   3. ⏳ Deploy Cloud Functions');
    console.log('   4. ⏳ Deploy database.rules.json');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('  1. Service account key is valid');
    console.error('  2. Firestore data exists');
    console.error('  3. Realtime Database is created');
    console.error('  4. Permissions are correct\n');
    process.exit(1);
  }
}

runMigration();
