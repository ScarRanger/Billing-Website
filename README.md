# Restaurant Billing System

A web-based restaurant billing and order management system built with Firebase.

## Features

- Real-time order tracking
- Pre-order management
- Digital payments with UPI
- Order status monitoring
- Admin dashboard for order management
- Google Sheets integration for order logging

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in the environment variables:

   - Firebase Configuration
   - Google API Configuration (for Sheets integration)
   - Business Information
   - Payment Details

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT="{Base64-encoded service account JSON}"
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
FIREBASE_APP_ID="your-app-id"
FIREBASE_COLLECTION_NAME="orders"

# Google API Configuration
GOOGLE_CREDENTIALS="{Base64-encoded service account JSON}"
GOOGLE_SHEET_ID="your-google-sheet-id"
GOOGLE_DRIVE_FOLDER_ID="your-google-drive-folder-id"

# Contact Information
CONTACT_PHONE="your-contact-number"
BUSINESS_NAME="your-business-name"
STALL_NUMBER="your-stall-number"

# Payment Information
UPI_ID="your-upi-id"
```

## Project Structure

```
.
├── api/                  # API routes
├── lib/                  # Shared libraries and utilities
├── public/              # Static files and client-side code
│   ├── form/           # Order form interface
│   ├── main/           # Main billing interface
│   ├── mojito/         # Special menu interface
│   └── summary/        # Order summary and management
└── ...
```

## Customizing Menu Items

1. Update the menu items in `.env`:
   - Set item names and prices
   - Configure categories (food, drinks, etc.)

2. Update the UI components in `public/*/index.html` files

## License

See the [LICENSE](LICENSE) file for details.
