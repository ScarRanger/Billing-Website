import { db, ORDERS_COLLECTION } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const data = req.body;  // The order data sent from the client
            // Log the order data to the Firestore collection
            await db.collection(ORDERS_COLLECTION).add(data);
            res.status(200).json({ status: 'Order logged to Firestore' });
        } catch (error) {
            console.error('Error logging to Firestore:', error);
            res.status(500).json({ status: 'Failed to log order to Firestore' });
        }
    } else {
        // If the method is not POST, send a 405 Method Not Allowed response
        res.status(405).json({ status: 'Method Not Allowed' });
    }
}
