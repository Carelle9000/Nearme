const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  console.error('Download it from: Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://nearme-bd95a-default-rtdb.firebaseio.com',
  storageBucket: 'nearme-bd95a.appspot.com',
});

const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// 20 complete French test users
const testUsers = [
  {
    email: 'alice.johnson@test.com',
    password: 'TestPass123!@',
    name: 'Alice Johnson',
    gender: 'female',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    birthYear: 1998,
    bio: '🌍 Voyageuse passionnée par les nouvelles cultures, adore les musées',
    interests: ['Travel', 'Art', 'Food', 'Photography'],
  },
  {
    email: 'bob.smith@test.com',
    password: 'TestPass123!@',
    name: 'Bob Smith',
    gender: 'male',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357,
    birthYear: 1996,
    bio: '⚽ Amateur de sport et de fitness, passionné par la musculation',
    interests: ['Sport', 'Fitness', 'Gaming', 'Traveling'],
  },
  {
    email: 'clara.martin@test.com',
    password: 'TestPass123!@',
    name: 'Clara Martin',
    gender: 'female',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    birthYear: 2000,
    bio: '🎵 Musicienne et productrice, j\'adore les concerts live',
    interests: ['Music', 'Art', 'Movies', 'Festivals'],
  },
  {
    email: 'david.laurent@test.com',
    password: 'TestPass123!@',
    name: 'David Laurent',
    gender: 'male',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4422,
    birthYear: 1997,
    bio: '📚 Bookworm et coffee addict, toujours en train de lire',
    interests: ['Books', 'Food', 'Travel', 'Coffee'],
  },
  {
    email: 'emma.wilson@test.com',
    password: 'TestPass123!@',
    name: 'Emma Wilson',
    gender: 'female',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.2620,
    birthYear: 1999,
    bio: '🎨 Artiste et designer graphique, créative et passionnée',
    interests: ['Art', 'Design', 'Photography', 'Fashion'],
  },
  {
    email: 'frank.brown@test.com',
    password: 'TestPass123!@',
    name: 'Frank Brown',
    gender: 'male',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    birthYear: 1995,
    bio: '🍷 Wine enthusiast et gourmet, amoureux de la bonne cuisine',
    interests: ['Food', 'Wine', 'Travel', 'Cooking'],
  },
  {
    email: 'grace.lee@test.com',
    password: 'TestPass123!@',
    name: 'Grace Lee',
    gender: 'female',
    city: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    birthYear: 2001,
    bio: '💪 Fitness coach et nutritionniste, je suis la santé et le bien-être',
    interests: ['Fitness', 'Health', 'Sport', 'Wellness'],
  },
  {
    email: 'henry.chen@test.com',
    password: 'TestPass123!@',
    name: 'Henry Chen',
    gender: 'male',
    city: 'Monaco',
    latitude: 43.7384,
    longitude: 7.4246,
    birthYear: 1994,
    bio: '🎬 Film director et cinéphile, j\'aime les bons films',
    interests: ['Movies', 'Photography', 'Art', 'Entertainment'],
  },
  {
    email: 'iris.moreau@test.com',
    password: 'TestPass123!@',
    name: 'Iris Moreau',
    gender: 'female',
    city: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
    birthYear: 1998,
    bio: '🌱 Eco-friendly lifestyle advocate, sustainable et responsable',
    interests: ['Travel', 'Fitness', 'Food', 'Nature'],
  },
  {
    email: 'jack.anderson@test.com',
    password: 'TestPass123!@',
    name: 'Jack Anderson',
    gender: 'male',
    city: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
    birthYear: 1997,
    bio: '🚀 Tech enthusiast et entrepreneur, passionné d\'innovation',
    interests: ['Gaming', 'Travel', 'Books', 'Technology'],
  },
  {
    email: 'kara.dupont@test.com',
    password: 'TestPass123!@',
    name: 'Kara Dupont',
    gender: 'female',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    birthYear: 1999,
    bio: '✨ Fashionista et lifestyle blogger, toujours tendance',
    interests: ['Fashion', 'Shopping', 'Travel', 'Photography'],
  },
  {
    email: 'leo.rousseau@test.com',
    password: 'TestPass123!@',
    name: 'Léo Rousseau',
    gender: 'male',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357,
    birthYear: 1998,
    bio: '🏔️ Aventurier et randonneur, j\'aime la montagne',
    interests: ['Hiking', 'Sport', 'Nature', 'Travel'],
  },
  {
    email: 'marina.belmont@test.com',
    password: 'TestPass123!@',
    name: 'Marina Belmont',
    gender: 'female',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    birthYear: 2001,
    bio: '🌊 Beach lover et surfeuse, accro à la mer',
    interests: ['Water Sports', 'Beach', 'Travel', 'Fitness'],
  },
  {
    email: 'nathan.grey@test.com',
    password: 'TestPass123!@',
    name: 'Nathan Grey',
    gender: 'male',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4422,
    birthYear: 1996,
    bio: '🎮 Gamer professionnel et streamer, passionné par les jeux vidéo',
    interests: ['Gaming', 'Technology', 'Streaming', 'Esports'],
  },
  {
    email: 'olivia.patel@test.com',
    password: 'TestPass123!@',
    name: 'Olivia Patel',
    gender: 'female',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.2620,
    birthYear: 1997,
    bio: '🧘 Yogi et coach de bien-être, croyante en l\'équilibre',
    interests: ['Yoga', 'Wellness', 'Meditation', 'Health'],
  },
  {
    email: 'pierre.vincent@test.com',
    password: 'TestPass123!@',
    name: 'Pierre Vincent',
    gender: 'male',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    birthYear: 1995,
    bio: '🍽️ Chef amateur et amateur de cuisine fusion',
    interests: ['Food', 'Cooking', 'Wine', 'Travel'],
  },
  {
    email: 'quinn.moreau@test.com',
    password: 'TestPass123!@',
    name: 'Quinn Moreau',
    gender: 'female',
    city: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    birthYear: 2000,
    bio: '📖 Autrice et critique littéraire, passionnée par les histoires',
    interests: ['Books', 'Writing', 'Art', 'Travel'],
  },
  {
    email: 'raphael.martin@test.com',
    password: 'TestPass123!@',
    name: 'Raphaël Martin',
    gender: 'male',
    city: 'Monaco',
    latitude: 43.7384,
    longitude: 7.4246,
    birthYear: 1994,
    bio: '🎹 Musicien classique et passionné de piano',
    interests: ['Music', 'Classical', 'Art', 'Travel'],
  },
  {
    email: 'sophie.bernard@test.com',
    password: 'TestPass123!@',
    name: 'Sophie Bernard',
    gender: 'female',
    city: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
    birthYear: 1999,
    bio: '🌸 Paysagiste et amante de la nature, créative',
    interests: ['Nature', 'Gardening', 'Photography', 'Travel'],
  },
  {
    email: 'thomas.leclerc@test.com',
    password: 'TestPass123!@',
    name: 'Thomas Leclerc',
    gender: 'male',
    city: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
    birthYear: 1997,
    bio: '🚗 Auto enthusiast et passionné de mécanique',
    interests: ['Cars', 'Technology', 'Travel', 'DIY'],
  },
];

// Function to download an image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    }).on('error', reject);
  });
}

// Generate avatar URL using DiceBear
function getAvatarUrl(name, gender) {
  // Use DiceBear API for consistent avatars
  const style = gender === 'male' ? 'adventurer' : 'adventurer-neutral';
  const seed = name.replace(/\s+/g, '');
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=200`;
}

// Upload photo to Firebase Storage
async function uploadPhotoToStorage(userId, imageBuffer, filename) {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(`photos/${userId}/${filename}`);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    // Get download URL
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15778800000, // 6 months
    });

    return url;
  } catch (error) {
    console.error(`Error uploading photo for user ${userId}:`, error.message);
    return null;
  }
}

async function seedUsers() {
  console.log('🌱 Starting user seeding with photos...\n');

  const createdUsers = [];
  let successCount = 0;
  let errorCount = 0;

  for (const userData of testUsers) {
    try {
      console.log(`\n📝 Processing: ${userData.name} (${userData.email})`);

      // Check if user already exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`   ℹ️  User already exists, skipping auth creation`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create user in Firebase Auth
          userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
          });
          console.log(`   ✅ Created user in Auth`);
        } else {
          throw error;
        }
      }

      const uid = userRecord.uid;
      const now = Date.now();
      const isoDate = new Date(now).toISOString();

      // Download and upload avatar photo
      let photoUrl = null;
      try {
        console.log(`   📸 Downloading avatar...`);
        const avatarUrl = getAvatarUrl(userData.name, userData.gender);
        const imageBuffer = await downloadImage(avatarUrl);

        console.log(`   ☁️  Uploading to Storage...`);
        const filename = `profile_${Date.now()}.png`;
        photoUrl = await uploadPhotoToStorage(uid, imageBuffer, filename);

        if (photoUrl) {
          console.log(`   ✅ Photo uploaded successfully`);
        } else {
          console.log(`   ⚠️  Photo upload failed, continuing without photo`);
        }
      } catch (error) {
        console.error(`   ❌ Error handling photo:`, error.message);
      }

      // Create profile in RTDB
      const profileData = {
        uid,
        name: userData.name,
        displayName: userData.name,
        email: userData.email,
        gender: userData.gender,
        city: userData.city,
        birthDate: new Date(userData.birthYear, 0, 1).toISOString(),
        bio: userData.bio,
        interests: userData.interests,
        location: {
          latitude: userData.latitude,
          longitude: userData.longitude,
          city: userData.city,
        },
        verified: true,
        isAgeVerified: true,
        createdAt: isoDate,
        updatedAt: isoDate,
        profileCompleted: true,
      };

      if (photoUrl) {
        profileData.photoUrl = photoUrl;
        profileData.photos = [photoUrl];
      }

      await db.ref(`profiles/${uid}`).set(profileData);
      console.log(`   ✅ Profile created in database`);

      createdUsers.push({
        uid,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        city: userData.city,
      });

      successCount++;
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`✅ Successfully created: ${successCount} users with photos`);
  console.log(`❌ Failed: ${errorCount} users`);
  console.log(`${'='.repeat(60)}\n`);

  console.log('🔑 Test Credentials:');
  console.log('━'.repeat(60));
  createdUsers.forEach((user, index) => {
    const userData = testUsers[index];
    console.log(`\n${index + 1}. ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log(`   City: ${user.city}`);
    console.log(`   UID: ${user.uid}`);
  });

  console.log(`\n${'━'.repeat(60)}`);
  console.log('✨ Seeding complete! You can now login with any account.\n');

  process.exit(0);
}

seedUsers().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
