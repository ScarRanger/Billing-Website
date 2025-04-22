import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        // Decode the base64-encoded service account JSON
        const credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
        );

        // Auth with Google Sheets
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const {
            timestamp,
            paymentMode,
            totalAmount,
            ...dishes
        } = req.body;

        const sheetId = process.env.GOOGLE_SHEET_ID;

        const row = [timestamp];

        const dishList = [
            "Pork Chilly",
            "Pork Vindaloo",
            "Pork Sarpotel",
            "Pork Sukha",
            "Chicken Bhujing",
            "Pattice",
            "Pattice Pav",
            "Omelette Pav",
            "Mojito",
            "Blue Lagoon",
            "Pink Lemonade",
            "Chicken Container"
        ];

        dishList.forEach(dish => row.push(dishes[dish] || 0));
        row.push(totalAmount, paymentMode);

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'main!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row],
            },
        });

        res.status(200).json({ message: 'Order logged to Google Sheets' });
    } catch (err) {
        console.error('Sheets API error:', err);
        res.status(500).json({ error: 'Failed to log order to Google Sheets' });
    }
}
