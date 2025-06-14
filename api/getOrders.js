import { db, ORDERS_COLLECTION } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const ordersSnapshot = await db.collection(ORDERS_COLLECTION)
                .orderBy('orderNumber', 'desc')
                .get();

            if (ordersSnapshot.empty) {
                return res.status(200).json([]);
            }

            const orders = ordersSnapshot.docs.map(doc => {
                const data = doc.data();
                const timestamp = data.timestamp?.toDate?.().toISOString?.() || '';

                const dishFields = [
                    "Item1", "Item2", "Item3", "Item4",
                    "Drink1", "Drink2", "Drink3",
                    "Special1", "Special2"
                ];

                const dishes = {};
                for (const dish of dishFields) {
                    dishes[dish] = data[dish] ?? '0';  // Default to '0' if missing
                }

                return {
                    id: doc.id,
                    ...data,
                    ...dishes, // Flatten dish quantities
                    timestamp, // Use ISO string for frontend sorting/display
                };
            });

            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ status: 'Failed to fetch orders' });
        }
    } else {
        res.status(405).json({ status: 'Method Not Allowed' });
    }
}
