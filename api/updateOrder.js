import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id, updatedData } = req.body;
        await db.collection('VU_billing').doc(id).update(updatedData);
        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error("Failed to update Firestore:", error);
        res.status(500).json({ error: 'Failed to update order' });
    }
}
