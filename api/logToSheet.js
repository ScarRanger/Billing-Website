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

        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        const {
            customerName = '',
            customAmount = '',
            notes = '',
            paymentMode = '',
            totalAmount = '',
            ...dishes
        } = req.body;

        const sheetId = process.env.GOOGLE_SHEET_ID;

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
            "Orange Lemonade",
            "Chicken Container",
            "Mineral Water"
        ];

        // Construct row data in the expected column order
        const row = [customerName];
        dishList.forEach(dish => row.push(dishes[dish] || 0));
        row.push(customAmount, totalAmount, paymentMode, notes);

        // Append the row to the next available row in the sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'main', // Specify the sheet name only
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS', // Ensure new rows are inserted
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
