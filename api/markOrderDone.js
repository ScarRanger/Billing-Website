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
        const { id } = req.body;

        const orderRef = db.collection('VU_billing').doc(id);
        await orderRef.update({ done: true });

        res.status(200).json({ message: 'Order marked as done' });
    } catch (error) {
        console.error('Error marking order as done:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
}
