import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'hotel-reservation-5d30d';

function getServiceAccountCredential() {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    return admin.credential.cert(JSON.parse(serviceAccountEnv));
  }

  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(__dirname, '../../firebase-service-account.json'),
    path.resolve(__dirname, '../../../firebase-service-account.json'),
    path.resolve(process.cwd(), 'firebase-service-account.json'),
    'c:/Users/joeyi/Downloads/hotel-reservation-5d30d-firebase-adminsdk-fbsvc-c3ee4cb133.json',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf8');
      return admin.credential.cert(JSON.parse(raw));
    }
  }

  return admin.credential.applicationDefault();
}

const app = !admin.apps.length
  ? admin.initializeApp({
      credential: getServiceAccountCredential(),
      projectId,
    })
  : admin.app();

const firestore = admin.firestore(app);
firestore.settings({ ignoreUndefinedProperties: true });

export { admin, firestore };
