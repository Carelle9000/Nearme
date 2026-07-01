const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://nearme-bd95a-default-rtdb.firebaseio.com',
});

const db = getDatabase(app);

// Paris center point
const CENTER_LAT = 48.8566;
const CENTER_LON = 2.3522;
const RADIUS_KM = 200;

// Generate random location within radius
function generateRandomLocation(centerLat, centerLon, radiusKm) {
  // Random angle (0-360 degrees)
  const angle = Math.random() * 360;
  const angleRad = (angle * Math.PI) / 180;

  // Random distance (0 to radiusKm)
  const distance = Math.random() * radiusKm;

  // Earth radius in km
  const R = 6371;

  // Calculate new coordinates
  const latOffset = (distance * Math.cos(angleRad)) / 111;
  const lonOffset = (distance * Math.sin(angleRad)) / (111 * Math.cos((centerLat * Math.PI) / 180));

  return {
    latitude: centerLat + latOffset,
    longitude: centerLon + lonOffset,
  };
}

async function updateProfilesLocations() {
  console.log('🌍 Updating profiles locations around Paris...\n');

  try {
    // Get all profiles
    const snapshot = await db.ref('profiles').get();

    if (!snapshot.exists()) {
      console.log('❌ No profiles found');
      process.exit(1);
    }

    const profiles = snapshot.val();
    const profileIds = Object.keys(profiles);

    console.log(`📍 Found ${profileIds.length} profiles`);
    console.log(`📌 Center: Paris (${CENTER_LAT}, ${CENTER_LON})`);
    console.log(`📏 Radius: ${RADIUS_KM}km\n`);

    let updatedCount = 0;

    // Update each profile with new location
    for (const uid of profileIds) {
      const profile = profiles[uid];
      const newLocation = generateRandomLocation(CENTER_LAT, CENTER_LON, RADIUS_KM);

      await db.ref(`profiles/${uid}/location`).set({
        latitude: parseFloat(newLocation.latitude.toFixed(6)),
        longitude: parseFloat(newLocation.longitude.toFixed(6)),
        city: profile.location?.city || 'France',
      });

      const name = profile.displayName || profile.name || uid;
      const distance = calculateDistance(
        CENTER_LAT,
        CENTER_LON,
        newLocation.latitude,
        newLocation.longitude
      );

      console.log(
        `✅ ${name.padEnd(20)} → (${newLocation.latitude.toFixed(4)}, ${newLocation.longitude.toFixed(4)}) - ${distance.toFixed(1)}km from Paris`
      );

      updatedCount++;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Successfully updated ${updatedCount} profiles`);
    console.log(`${'='.repeat(80)}\n`);

    console.log('🎯 TEST LOCATION:');
    console.log('━'.repeat(80));
    console.log(`   Latitude:  ${CENTER_LAT}`);
    console.log(`   Longitude: ${CENTER_LON}`);
    console.log(`   City: Paris, France`);
    console.log('━'.repeat(80));
    console.log('\n💡 Use this location to test the app - all 20 profiles will be within 200km!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating profiles:', error);
    process.exit(1);
  }
}

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

updateProfilesLocations();
