import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream'; // Import Readable from 'stream'

function bufferToStream(buffer) {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null); // Signal the end of the stream
    return readable;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        const credentials = JSON.parse(
            Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8')
        );

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file',
            ],
        });

        const drive = google.drive({ version: 'v3', auth });
        const sheets = google.sheets({ version: 'v4', auth });

        const {
            customerName,
            customerPhone,
            pickupTime,
            transactionId,
            paymentScreenshot, // Base64 string
            totalAmount,
            customAmount,
            notes,
            dishes,
        } = req.body;

        const sheetId = process.env.GOOGLE_SHEET_ID;
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        // Convert payment screenshot to Buffer
        const buffer = Buffer.from(paymentScreenshot, 'base64');

        // Upload payment screenshot to Google Drive
        const fileMetadata = {
            name: `payment_${uuidv4()}.png`,
            parents: [folderId],
        };
        const media = {
            mimeType: 'image/png',
            body: bufferToStream(buffer), // Convert buffer to stream
        };

        const driveResponse = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        const publicUrl = `https://drive.google.com/uc?id=${driveResponse.data.id}`;

        // Make the file publicly accessible
        await drive.permissions.create({
            fileId: driveResponse.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Construct row data for Google Sheets
        const row = [
            new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            customerName,
            customerPhone,
            pickupTime,
            transactionId,
            publicUrl, // Public URL of the payment screenshot
            ...Object.values(dishes),
            totalAmount,
        ];

        // Append the row to the Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: 'Preorders!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row],
            },
        });

        res.status(200).json({ message: 'Preorder logged successfully', publicUrl });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Failed to log preorder' });
    }
}