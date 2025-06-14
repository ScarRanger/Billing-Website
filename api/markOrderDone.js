import { db, ORDERS_COLLECTION } from '../lib/firebaseAdmin';



export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing order ID' });
        }

        const orderRef = db.collection(ORDERS_COLLECTION).doc(id);

        // Only mark as done, assuming edits are already applied
        await orderRef.update({
            done: true,
            markedDone: true,
            finalizedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'Order successfully marked as done' });
    } catch (error) {
        console.error('Error marking order as done:', error);
        res.status(500).json({ error: 'Failed to mark order as done' });
    }
}
