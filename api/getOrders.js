import { db } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const ordersSnapshot = await db.collection('VU_billing')
                .orderBy('timestamp', 'desc')
                .get();

            if (ordersSnapshot.empty) {
                return res.status(200).json([]);
            }

            const orders = ordersSnapshot.docs.map(doc => {
                const data = doc.data();

                // Convert Firestore timestamp to ISO string
                const timestamp = data.timestamp?.toDate?.().toISOString?.() || '';

                // Extract and ensure dish data is flat and display-safe
                const dishFields = [
                    "Pork Chilly", "Pork Vindaloo", "Pork Sarpotel", "Pork Sukha", "Chicken Bhujing",
                    "Pattice", "Pattice Pav", "Omelette Pav", "Mojito", "Blue Lagoon", "Pink Lemonade",
                    "Chicken Container"
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
