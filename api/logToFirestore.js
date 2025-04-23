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

        const counterRef = db.collection('VU_counters').doc('orderNumber');
        const ordersRef = db.collection('VU_billing');

        let orderNumber;

        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            const current = counterDoc.exists ? parseInt(counterDoc.data().current, 10) : 0;
            const nextOrderNumber = current + 1;

            orderNumber = nextOrderNumber;

            const newOrder = {
                ...data,
                timestamp: admin.firestore.Timestamp.now(),
                orderNumber: nextOrderNumber
            };

            const newDocRef = ordersRef.doc();
            transaction.set(counterRef, { current: nextOrderNumber }, { merge: true });
            transaction.set(newDocRef, newOrder);
        });

        return res.status(200).json({
            message: 'Order logged to Firestore',
            orderNumber: orderNumber
        });

    } catch (error) {
        console.error('Error logging order:', error);
        res.status(500).json({ error: 'Failed to log order' });
    }
}
