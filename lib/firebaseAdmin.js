import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
}

const db = admin.firestore();

export { db };
