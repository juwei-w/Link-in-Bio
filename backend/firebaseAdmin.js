const admin = require('firebase-admin');
const fs = require('fs');

let initialized = false;

function init() {
  if (initialized) return admin;

  // Render.com stores secret files at /etc/secrets/
  const renderSecretPath = '/etc/secrets/serviceAccountKey.json';
  const localPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let creds = null;
  
  // Priority 1: Environment variable (JSON string)
  if (serviceAccountJson) {
    try {
      creds = JSON.parse(serviceAccountJson);
    } catch (err) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  } 
  // Priority 2: Render secret file location
  else if (fs.existsSync(renderSecretPath)) {
    try {
      creds = JSON.parse(fs.readFileSync(renderSecretPath, 'utf8'));
      console.log('✓ Firebase Admin SDK loaded from Render secret file');
    } catch (err) {
      console.error('Failed reading Render secret file:', err.message);
    }
  }
  // Priority 3: Local path from env variable
  else if (localPath && fs.existsSync(localPath)) {
    try {
      creds = JSON.parse(fs.readFileSync(localPath, 'utf8'));
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
