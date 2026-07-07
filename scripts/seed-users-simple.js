const fs = require('fs');
const path = require('path');

// Load service account
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  console.error('Download it from: Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin
const admin = require('firebase-admin');

const app = admin.initializeApp({
  projectId: serviceAccount.project_id,
  serviceAccountId: serviceAccount.client_email,
  privateKey: serviceAccount.private_key,
  databaseURL: 'https://nearme-bd95a-default-rtdb.firebaseio.com',
});

const auth = admin.auth();
const db = admin.database();

// Test users data
const testUsers = [
  {
    email: 'alice@test.com',
    password: 'TestPass123!@',
    name: 'Alice Johnson',
    gender: 'Femme',
    city: 'Paris',
    birthYear: 1998,
    bio: '🌍 Voyageuse passionnée par les nouvelles cultures',
    interests: ['Travel', 'Art', 'Food'],
  },
  {
    email: 'bob@test.com',
    password: 'TestPass123!@',
    name: 'Bob Smith',
    gender: 'Homme',
    city: 'Lyon',
    birthYear: 1996,
    bio: '⚽ Amateur de sport et de fitness',
    interests: ['Sport', 'Fitness', 'Gaming'],
  },
  {
    email: 'clara@test.com',
    password: 'TestPass123!@',
    name: 'Clara Martin',
    gender: 'Femme',
    city: 'Marseille',
    birthYear: 2000,
    bio: '🎵 Musicienne et productrice',
    interests: ['Music', 'Art', 'Movies'],
  },
  {
    email: 'david@test.com',
    password: 'TestPass123!@',
    name: 'David Laurent',
    gender: 'Homme',
    city: 'Toulouse',
    birthYear: 1997,
    bio: '📚 Bookworm et coffee addict',
    interests: ['Books', 'Food', 'Travel'],
  },
  {
    email: 'emma@test.com',
    password: 'TestPass123!@',
    name: 'Emma Wilson',
    gender: 'Femme',
    city: 'Nice',
    birthYear: 1999,
    bio: '🎨 Artiste et designer graphique',
    interests: ['Art', 'Design', 'Photography'],
  },
  {
    email: 'frank@test.com',
    password: 'TestPass123!@',
    name: 'Frank Brown',
    gender: 'Homme',
    city: 'Bordeaux',
    birthYear: 1995,
    bio: '🍷 Wine enthusiast et gourmet',
    interests: ['Food', 'Wine', 'Travel'],
  },
  {
    email: 'grace@test.com',
    password: 'TestPass123!@',
    name: 'Grace Lee',
    gender: 'Femme',
    city: 'Lille',
    birthYear: 2001,
    bio: '💪 Fitness coach et nutritionniste',
    interests: ['Fitness', 'Health', 'Sport'],
  },
  {
    email: 'henry@test.com',
    password: 'TestPass123!@',
    name: 'Henry Chen',
    gender: 'Homme',
    city: 'Monaco',
    birthYear: 1994,
    bio: '🎬 Film director et cinéphile',
    interests: ['Movies', 'Photography', 'Art'],
  },
  {
    email: 'iris@test.com',
    password: 'TestPass123!@',
    name: 'Iris Moreau',
    gender: 'Femme',
    city: 'Strasbourg',
    birthYear: 1998,
    bio: '🌱 Eco-friendly lifestyle advocate',
    interests: ['Travel', 'Fitness', 'Food'],
  },
  {
    email: 'jack@test.com',
    password: 'TestPass123!@',
    name: 'Jack Anderson',
    gender: 'Homme',
    city: 'Nantes',
    birthYear: 1997,
    bio: '🚀 Tech enthusiast et entrepreneur',
    interests: ['Gaming', 'Travel', 'Books'],
  },
];

async function seedUsers() {
  console.log('🌱 Starting user seeding...\n');

  const createdUsers = [];
  let successCount = 0;
  let errorCount = 0;

  for (const userData of testUsers) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });

      const uid = userRecord.uid;

      // Create profile in RTDB
      const now = Date.now();
      const profileData = {
        uid,
        email: userData.email,
        firstName: userData.name,
        gender: userData.gender,
        city: userData.city,
        birthYear: userData.birthYear,
        bio: userData.bio,
        interests: userData.interests,
        createdAt: now,
        updatedAt: now,
        profileCompleted: true,
      };

      await db.ref(`profiles/${uid}`).set(profileData);

      createdUsers.push({
        uid,
        email: userData.email,
        name: userData.name,
        password: userData.password,
      });

      console.log(`✅ Created: ${userData.email} (${userData.name})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed: ${errorCount} users`);
  console.log(`${'='.repeat(50)}\n`);

  console.log('🔑 Test Credentials:');
  console.log('━'.repeat(50));
  createdUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
  });

  console.log(`\n${'━'.repeat(50)}`);
  console.log('💡 You can now login with any of these accounts!\n');

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
