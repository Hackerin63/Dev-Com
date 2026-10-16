// Shared helper: loads the service account key from this folder (or GOOGLE_APPLICATION_CREDENTIALS).
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');

function init() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('\nCould not find the service account key at:\n  ' + keyPath);
    console.error('\nDownload it from Firebase Console > Project settings > Service accounts >');
    console.error('"Generate new private key", then save it as firebase/setup/serviceAccountKey.json');
    console.error('(this file is git-ignored; never put it inside the app or share it).\n');
    process.exit(1);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  return initializeApp({ credential: cert(serviceAccount) });
}

module.exports = { init };
