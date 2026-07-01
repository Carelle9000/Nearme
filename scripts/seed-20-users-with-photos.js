const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');
const https = require('https');
const ngeohash = require('ngeohash');

const GEOHASH_STORAGE_PRECISION = 7;

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

// Paris center point
const PARIS_LAT = 48.8566;
const PARIS_LON = 2.3522;
const RADIUS_KM = 200;

// Function to generate random location around Paris
function generateRandomLocationAroundParis() {
  const angle = Math.random() * 360;
  const angleRad = (angle * Math.PI) / 180;
  const distance = Math.random() * RADIUS_KM;
  const R = 6371;

  const latOffset = (distance * Math.cos(angleRad)) / 111;
  const lonOffset = (distance * Math.sin(angleRad)) / (111 * Math.cos((PARIS_LAT * Math.PI) / 180));

  return {
    latitude: PARIS_LAT + latOffset,
    longitude: PARIS_LON + lonOffset,
  };
}

// 20 complete French test users - All around Paris
const testUsers = [
  {
    email: 'alice.johnson@test.com',
    password: 'TestPass123!@',
    name: 'Alice Johnson',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1998,
    bio: '🌍 Voyageuse passionnée par les nouvelles cultures, adore les musées',
    interests: ['Travel', 'Art', 'Food', 'Photography'],
  },
  {
    email: 'bob.smith@test.com',
    password: 'TestPass123!@',
    name: 'Bob Smith',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1996,
    bio: '⚽ Amateur de sport et de fitness, passionné par la musculation',
    interests: ['Sport', 'Fitness', 'Gaming', 'Traveling'],
  },
  {
    email: 'clara.martin@test.com',
    password: 'TestPass123!@',
    name: 'Clara Martin',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 2000,
    bio: '🎵 Musicienne et productrice, j\'adore les concerts live',
    interests: ['Music', 'Art', 'Movies', 'Festivals'],
  },
  {
    email: 'david.laurent@test.com',
    password: 'TestPass123!@',
    name: 'David Laurent',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1997,
    bio: '📚 Bookworm et coffee addict, toujours en train de lire',
    interests: ['Books', 'Food', 'Travel', 'Coffee'],
  },
  {
    email: 'emma.wilson@test.com',
    password: 'TestPass123!@',
    name: 'Emma Wilson',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1999,
    bio: '🎨 Artiste et designer graphique, créative et passionnée',
    interests: ['Art', 'Design', 'Photography', 'Fashion'],
  },
  {
    email: 'frank.brown@test.com',
    password: 'TestPass123!@',
    name: 'Frank Brown',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1995,
    bio: '🍷 Wine enthusiast et gourmet, amoureux de la bonne cuisine',
    interests: ['Food', 'Wine', 'Travel', 'Cooking'],
  },
  {
    email: 'grace.lee@test.com',
    password: 'TestPass123!@',
    name: 'Grace Lee',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 2001,
    bio: '💪 Fitness coach et nutritionniste, je suis la santé et le bien-être',
    interests: ['Fitness', 'Health', 'Sport', 'Wellness'],
  },
  {
    email: 'henry.chen@test.com',
    password: 'TestPass123!@',
    name: 'Henry Chen',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1994,
    bio: '🎬 Film director et cinéphile, j\'aime les bons films',
    interests: ['Movies', 'Photography', 'Art', 'Entertainment'],
  },
  {
    email: 'iris.moreau@test.com',
    password: 'TestPass123!@',
    name: 'Iris Moreau',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1998,
    bio: '🌱 Eco-friendly lifestyle advocate, sustainable et responsable',
    interests: ['Travel', 'Fitness', 'Food', 'Nature'],
  },
  {
    email: 'jack.anderson@test.com',
    password: 'TestPass123!@',
    name: 'Jack Anderson',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
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
    ...generateRandomLocationAroundParis(),
    birthYear: 1999,
    bio: '✨ Fashionista et lifestyle blogger, toujours tendance',
    interests: ['Fashion', 'Shopping', 'Travel', 'Photography'],
  },
  {
    email: 'leo.rousseau@test.com',
    password: 'TestPass123!@',
    name: 'Léo Rousseau',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1998,
    bio: '🏔️ Aventurier et randonneur, j\'aime la montagne',
    interests: ['Hiking', 'Sport', 'Nature', 'Travel'],
  },
  {
    email: 'marina.belmont@test.com',
    password: 'TestPass123!@',
    name: 'Marina Belmont',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 2001,
    bio: '🌊 Beach lover et surfeuse, accro à la mer',
    interests: ['Water Sports', 'Beach', 'Travel', 'Fitness'],
  },
  {
    email: 'nathan.grey@test.com',
    password: 'TestPass123!@',
    name: 'Nathan Grey',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1996,
    bio: '🎮 Gamer professionnel et streamer, passionné par les jeux vidéo',
    interests: ['Gaming', 'Technology', 'Streaming', 'Esports'],
  },
  {
    email: 'olivia.patel@test.com',
    password: 'TestPass123!@',
    name: 'Olivia Patel',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1997,
    bio: '🧘 Yogi et coach de bien-être, croyante en l\'équilibre',
    interests: ['Yoga', 'Wellness', 'Meditation', 'Health'],
  },
  {
    email: 'pierre.vincent@test.com',
    password: 'TestPass123!@',
    name: 'Pierre Vincent',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1995,
    bio: '🍽️ Chef amateur et amateur de cuisine fusion',
    interests: ['Food', 'Cooking', 'Wine', 'Travel'],
  },
  {
    email: 'quinn.moreau@test.com',
    password: 'TestPass123!@',
    name: 'Quinn Moreau',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 2000,
    bio: '📖 Autrice et critique littéraire, passionnée par les histoires',
    interests: ['Books', 'Writing', 'Art', 'Travel'],
  },
  {
    email: 'raphael.martin@test.com',
    password: 'TestPass123!@',
    name: 'Raphaël Martin',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1994,
    bio: '🎹 Musicien classique et passionné de piano',
    interests: ['Music', 'Classical', 'Art', 'Travel'],
  },
  {
    email: 'sophie.bernard@test.com',
    password: 'TestPass123!@',
    name: 'Sophie Bernard',
    gender: 'female',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1999,
    bio: '🌸 Paysagiste et amante de la nature, créative',
    interests: ['Nature', 'Gardening', 'Photography', 'Travel'],
  },
  {
    email: 'thomas.leclerc@test.com',
    password: 'TestPass123!@',
    name: 'Thomas Leclerc',
    gender: 'male',
    city: 'Paris',
    ...generateRandomLocationAroundParis(),
    birthYear: 1997,
    bio: '🚗 Auto enthusiast et passionné de mécanique',
    interests: ['Cars', 'Technology', 'Travel', 'DIY'],
  },
];

// Available local profile photos
const AVAILABLE_PHOTOS = [
  'photo1.jpg',
  'photo2.jpg',
  'photo3.jpg',
  'photo4.jpg',
  'photo5.jpg',
  'photo6.jpg',
  'photo7.jpg',
  'photo8.jpg',
  'photo9.jpg',
  'photo10.jpg',
  'photo11.jpg',
  'photo8.webp',
];

// Get photo for user by cycling through available photos
function getPhotoForUser(index) {
  return AVAILABLE_PHOTOS[index % AVAILABLE_PHOTOS.length];
}

// Read local photo file
function readLocalPhoto(filename) {
  try {
    const photoPath = path.join(__dirname, '../assets/images', filename);
    if (!fs.existsSync(photoPath)) {
      console.log(`   ⚠️  Photo file not found: ${filename}`);
      return null;
    }
    return fs.readFileSync(photoPath);
  } catch (error) {
    console.error(`   ❌ Error reading photo ${filename}:`, error.message);
    return null;
  }
}

// Upload photo to Firebase Storage
async function uploadPhotoToStorage(userId, imageBuffer, filename) {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(`photos/${userId}/${filename}`);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypeMap[ext] || 'image/jpeg';

    await file.save(imageBuffer, {
      metadata: {
        contentType,
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

      // Load and upload local profile photo
      let photoUrl = null;
      try {
        const userIndex = createdUsers.length;
        const photoFilename = getPhotoForUser(userIndex);
        console.log(`   📸 Loading profile photo: ${photoFilename}`);

        const imageBuffer = readLocalPhoto(photoFilename);
        if (!imageBuffer) {
          console.log(`   ⚠️  Could not load photo, continuing without photo`);
        } else {
          console.log(`   ☁️  Uploading to Storage...`);
          const ext = path.extname(photoFilename);
          const uploadFilename = `profile_${Date.now()}${ext}`;
          photoUrl = await uploadPhotoToStorage(uid, imageBuffer, uploadFilename);

          if (photoUrl) {
            console.log(`   ✅ Photo uploaded successfully`);
          } else {
            console.log(`   ⚠️  Photo upload failed, continuing without photo`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Error handling photo:`, error.message);
      }

      // Create profile in RTDB
      const geohash = ngeohash.encode(userData.latitude, userData.longitude, GEOHASH_STORAGE_PRECISION);
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
        geohash,
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
