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
        const data = req.body;

        // Don't trust timestamp from client — set on server
        const counterRef = db.collection('VU_counters').doc('orderNumber');
        const ordersRef = db.collection('VU_billing');

        const orderNumber = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const current = counterDoc.exists ? parseInt(counterDoc.data().current, 10) : 0; // Ensure it's an integer
            const nextOrderNumber = current + 1;

            transaction.set(counterRef, { current: nextOrderNumber }, { merge: true });

            const newOrder = {
                ...data,
                timestamp: admin.firestore.Timestamp.now(), // ✅ Correct timestamp type
                orderNumber: nextOrderNumber
            };

            const newDocRef = ordersRef.doc();
            transaction.set(newDocRef, newOrder);

            return nextOrderNumber;
        });

        res.status(200).json({ message: 'Order logged', orderNumber });
    } catch (error) {
        console.error('Error logging order:', error);
        res.status(500).json({ error: 'Failed to log order' });
    }
}
