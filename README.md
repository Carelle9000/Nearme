# NearMe - React Native Migration

React Native (Expo) version of NearMe dating app, replacing the Flutter implementation.

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with your Firebase credentials (see `.env.example`):
```bash
cp .env.example .env.local
```

3. Update the environment variables with your Firebase project details.

## Running

Start the development server:
```bash
npm start
```

Run on iOS:
```bash
npm run ios
```

Run on Android:
```bash
npm run android
```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Main app tabs
│   ├── auth/              # Authentication screens
│   └── index.tsx          # Root layout
├── config/                # Firebase configuration
├── context/               # React Context (Auth)
├── models/                # TypeScript interfaces
├── services/              # Firebase & API integrations
└── components/            # Reusable components
```

## Features Status

- ✅ Firebase authentication
- ✅ Auth context & state management
- ✅ Navigation structure
- ⏳ Discovery feed
- ⏳ Real-time chat
- ⏳ Matching algorithm
- ⏳ Photo management
- ⏳ Location services
- ⏳ Age verification
- ⏳ Push notifications
