# Dev-Com

A React Native (Expo SDK 57) + TypeScript Android shopping app with Firebase Authentication and Cloud Firestore.
Customers browse, add to cart, and order with **Cash on Delivery**. Admins manage products, orders, and users from a protected in-app dashboard.

## Features
- **Customer:** home with search and categories, product details with stock, persistent cart, COD checkout, order history, profile, light/dark/system theme, loading/empty/error states.
- **Admin:** dashboard counts, add/edit/delete products, view orders and update status (stock is deducted on confirm and restored on cancel), view registered users.
- **Security:** admin rights are a Firebase custom claim set only by the Admin SDK script. Firestore Security Rules enforce all authorization; the UI redirect is only a convenience.

## Quick start
```
npm install
copy .env.example .env     # then fill in your Firebase values
npx expo start             # scan the QR code with Expo Go
```
Firebase must be set up first (project, Email/Password sign-in, Firestore, rules).

## Guides (read in this order)
1. `docs/FIREBASE_SETUP.md`: Firebase project, `.env`, rules, secure first-admin script, demo products, database structure, known limits.
2. `docs/RUN_AND_BUILD.md`: running locally, Expo Go testing, building and installing the APK with EAS, Windows error fixes.

## Project layout
```
src/app/          screens and navigation (Expo Router): (auth), (app)/(tabs), (app)/(admin), details
src/components/   reusable UI (Button, TextField, ProductCard, ...)
src/services/     Firebase and data operations
src/context/      Auth, Cart, Theme providers
src/hooks/        data-loading hook
src/types/        TypeScript interfaces
src/constants/    theme and app config (brand, categories, currency symbol)
src/utils/        validation, formatting, error messages
firebase/         security rules, index config, one-time setup scripts
docs/             setup and build guides
assets/           app icon, splash, adaptive icon (placeholders, replace with your logo)
```

## Customising
- Brand name, categories, currency symbol: `src/constants/config.ts`
- Colours: `src/constants/theme.ts`
- Android package ID: `android.package` in `app.json` (use your own unique ID before publishing)

## Security notes
- Never commit `.env` or `firebase/setup/serviceAccountKey.json` (both are git-ignored). The service account key must never be placed inside the app.
- Prices inside orders can't be verified by Firestore rules alone. Admin order confirmation re-checks them against the catalogue. Full prevention needs Cloud Functions (paid plan).

## Status
Type-checked, linted, and bundled for Android. Not yet run against a live Firebase project or built into an APK; follow the guides above to do both.
