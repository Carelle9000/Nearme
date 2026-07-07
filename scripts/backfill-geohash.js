// Backfill script: writes profiles/{uid}/geohash for every profile that already
// has a valid location.latitude / location.longitude but no geohash yet.
//
// Run once after deploying the geohash change:
//   node scripts/backfill-geohash.js
//
// Requires serviceAccountKey.json at the repo root.

const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');
const ngeohash = require('ngeohash');
const fs = require('fs');
const path = require('path');

const GEOHASH_PRECISION = 7;

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ serviceAccountKey.json not found at repo root');
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

const app = admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: 'https://nearme-bd95a-default-rtdb.firebaseio.com',
});

const db = getDatabase(app);

function hasValidCoords(loc) {
  return (
    loc &&
    typeof loc.latitude === 'number' &&
    typeof loc.longitude === 'number' &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude)
  );
}

async function main() {
  console.log('Reading profiles...');
  const snapshot = await db.ref('profiles').once('value');
  const profiles = snapshot.val() || {};
  const uids = Object.keys(profiles);
  console.log(`Found ${uids.length} profiles`);

  const updates = {};
  let skippedNoLoc = 0;
  let skippedAlreadyHas = 0;
  let planned = 0;

  for (const uid of uids) {
    const profile = profiles[uid];
    if (!hasValidCoords(profile.location)) {
      skippedNoLoc++;
      continue;
    }
    if (typeof profile.geohash === 'string' && profile.geohash.length >= GEOHASH_PRECISION) {
      skippedAlreadyHas++;
      continue;
    }
    const gh = ngeohash.encode(
      profile.location.latitude,
      profile.location.longitude,
      GEOHASH_PRECISION
    );
    updates[`profiles/${uid}/geohash`] = gh;
    planned++;
  }

  console.log(
    `Plan: ${planned} to backfill, ${skippedAlreadyHas} already have geohash, ` +
    `${skippedNoLoc} skipped (no valid coords)`
  );

  if (planned === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  console.log('Writing updates...');
  await db.ref().update(updates);
  console.log(`✅ Backfilled ${planned} profiles`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
