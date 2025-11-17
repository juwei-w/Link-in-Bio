const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

function init() {
  if (initialized) return admin;

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let creds = null;
  if (serviceAccountJson) {
    try {
      creds = JSON.parse(serviceAccountJson);
    } catch (err) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  } else if (serviceAccountPath) {
    try {
      creds = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (err) {
      console.error('Failed reading FIREBASE_SERVICE_ACCOUNT_PATH:', err.message);
    }
  }

  if (!creds) {
    console.warn('Firebase service account not configured. Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON to enable.');
    return null;
  }

  admin.initializeApp({ credential: admin.credential.cert(creds) });
  initialized = true;
  console.log('Firebase Admin initialized');
  return admin;
}

module.exports = { init };
