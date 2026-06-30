import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.database();
const firestore = admin.firestore();

export const migrateFirestoreToRTDB = onRequest(
  { region: 'europe-west1', cors: true },
  async (request, response) => {
    try {
      console.log('🚀 Starting migration from Firestore to Realtime Database...\n');

      const startTime = Date.now();

      // Migrate Users
      console.log('📥 Migrating users...');
      const usersSnapshot = await firestore.collection('users').get();
      const users: any = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users[doc.id] = {
          email: data.email || '',
          displayName: data.displayName || data.name || '',
          photoUrl: data.photoUrl || '',
          isAgeVerified: data.isAgeVerified || false,
          verified: data.verified || false,
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
        };
      });
      if (Object.keys(users).length > 0) {
        await db.ref('users').set(users);
      }
      console.log(`✅ Users migrated: ${Object.keys(users).length}`);

      // Migrate Profiles
      console.log('📥 Migrating profiles...');
      const profilesSnapshot = await firestore.collection('profiles').get();
      const profiles: any = {};
      profilesSnapshot.forEach((doc) => {
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
          sent_likes: {},
          received_likes: {},
          nopes: {},
          favorites: {},
          notifications: {}
        };
      });
      await db.ref('profiles').set(profiles);
      console.log(`✅ Profiles migrated: ${Object.keys(profiles).length}`);

      // Migrate Matches with Messages
      console.log('📥 Migrating matches...');
      const matchesSnapshot = await firestore.collection('matches').get();
      const matches: any = {};
      let matchCount = 0;

      for (const doc of matchesSnapshot.docs) {
        const matchData = doc.data();
        const messages: any = {};

        const messagesSnap = await doc.ref.collection('messages').get();
        messagesSnap.forEach((msgDoc) => {
          const msgData = msgDoc.data();
          messages[msgDoc.id] = {
            senderId: msgData.senderId || '',
            content: msgData.content || '',
            type: msgData.type || 'text',
            sentAt: msgData.sentAt?.toMillis?.() || Date.now(),
            status: msgData.status || 'sent',
            readAt: msgData.readAt?.toMillis?.() || null,
          };
        });

        matches[doc.id] = {
          userId1: matchData.users?.[0] || matchData.userId1 || '',
          userId2: matchData.users?.[1] || matchData.userId2 || '',
          matchedAt: matchData.matchedAt?.toMillis?.() || Date.now(),
          lastInteractionAt: matchData.lastInteractionAt?.toMillis?.() || Date.now(),
          messages: messages,
        };
        matchCount++;
      }
      await db.ref('matches').set(matches);
      console.log(`✅ Matches migrated: ${matchCount}`);

      // Migrate Sent Likes
      console.log('📥 Migrating sent likes...');
      let totalLikes = 0;
      for (const profileDoc of profilesSnapshot.docs) {
        const userId = profileDoc.id;
        const sentLikesSnap = await profileDoc.ref.collection('sent_likes').get();
        const sentLikes: any = {};

        sentLikesSnap.forEach((doc) => {
          sentLikes[doc.id] = {
            createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
            targetId: doc.id,
          };
        });

        if (Object.keys(sentLikes).length > 0) {
          await db.ref(`profiles/${userId}/sent_likes`).set(sentLikes);
          totalLikes += Object.keys(sentLikes).length;
        }
      }
      console.log(`✅ Sent likes migrated: ${totalLikes}`);

      // Migrate Blocks
      console.log('📥 Migrating blocks...');
      const blocksSnapshot = await firestore.collection('blocks').get();
      const blocks: any = {};
      blocksSnapshot.forEach((doc) => {
        const data = doc.data();
        blocks[doc.id] = {
          blockerId: data.blockerId || '',
          blockedId: data.blockedId || '',
          createdAt: data.createdAt?.toMillis?.() || Date.now(),
        };
      });
      if (Object.keys(blocks).length > 0) {
        await db.ref('blocks').set(blocks);
      }
      console.log(`✅ Blocks migrated: ${Object.keys(blocks).length}`);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const result = {
        success: true,
        message: '✅ Migration completed successfully!',
        duration: `${duration}s`,
        stats: {
          users: Object.keys(users).length,
          profiles: Object.keys(profiles).length,
          matches: matchCount,
          likes: totalLikes,
          blocks: Object.keys(blocks).length,
        },
        nextSteps: [
          '1. Verify data in Firebase Console Realtime Database',
          '2. Deploy cloud functions: sendLikeRTDB, sendMessageRTDB, blockUserRTDB',
          '3. Deploy database.rules.json',
          '4. Test thoroughly before going to production',
        ],
      };

      response.json(result);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      response.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);
