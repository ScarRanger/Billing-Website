import { db, ORDERS_COLLECTION } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id, updatedData } = req.body;
        await db.collection(ORDERS_COLLECTION).doc(id).update(updatedData);
        res.status(200).json({ message: 'Order updated successfully' });
    } catch (error) {
        console.error("Failed to update Firestore:", error);
        res.status(500).json({ error: 'Failed to update order' });
    }
}
