# Dev-Com: Firebase setup (beginner guide)

The app can use Firebase **Spark** without Firebase Storage. Device photos are compressed and stored in Firestore product documents; URL-based product images are also supported.
Menu names in the Firebase console change occasionally; if a label differs slightly, look for the closest match.

## 1. Create the project
1. Open https://console.firebase.google.com and sign in with a Google account.
2. **Create a project** (or "Add project"), for example `dev-com-shop`. You can turn Google Analytics off.

## 2. Register a Web app and copy its config
1. On the project home page click the **Web** icon (`</>`) to add an app. Nickname: `dev-com`. Skip Firebase Hosting.
2. Firebase shows a `firebaseConfig` block. Keep that page open.
3. In the project folder, copy `.env.example` to `.env` (Windows PowerShell: `Copy-Item .env.example .env`).
4. Paste each value into `.env`:

| `.env` variable | `firebaseConfig` key |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |

These are public identifiers, not passwords. Your data is protected by the security rules (step 5), not by hiding this config. Do not add quotes around the values.

## 3. Turn on email/password sign-in
**Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save.**

## 4. Create the Firestore database
1. **Build > Firestore Database > Create database.**
2. Choose a location close to your customers. **This cannot be changed later.**
3. Start in **production mode** (locked), because you will publish proper rules next.

## 5. Publish the security rules
**Option A, console (easiest):** Firestore Database > **Rules** tab. Delete everything, paste the entire contents of `firebase/firestore.rules`, click **Publish**.

**Device product photos:** No Firebase Storage bucket is required. The app resizes photos to at most 640 px, compresses them to JPEG, and stores the image data in the product document (up to 650,000 characters). This keeps each product below Firestore's 1 MiB document limit, but increases Firestore document downloads. Large catalogs should use a separate image host or Firebase Storage.

**Option B, Firebase CLI (Firestore rules):**
```
cd firebase
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project YOUR_PROJECT_ID
```

## 5a. Set up Razorpay test payments (optional)
Razorpay payments are created and verified by Firebase Cloud Functions; the app never receives the API secret. Cloud Functions require the Firebase **Blaze** plan, even when using Razorpay test credentials.

1. In the Razorpay Dashboard, switch to **Test Mode** and generate test API keys. Do not use live keys: the deployed functions reject any key ID that does not start with `rzp_test_`.
2. In the Razorpay Dashboard, create a webhook for the `payment.captured` event and set a webhook secret. You will register the URL after deploying the functions.
3. From PowerShell, set the three Firebase secrets and deploy (replace the project ID):
   ```
   cd firebase
   npx firebase-tools functions:secrets:set RAZORPAY_KEY_ID --project YOUR_PROJECT_ID
   npx firebase-tools functions:secrets:set RAZORPAY_KEY_SECRET --project YOUR_PROJECT_ID
   npx firebase-tools functions:secrets:set RAZORPAY_WEBHOOK_SECRET --project YOUR_PROJECT_ID
   npx firebase-tools deploy --only functions --project YOUR_PROJECT_ID
   ```
   Enter the test key ID, test key secret, and the exact webhook secret when prompted. Keep all three server-side; do not add them to `.env`, app config, or Firestore.
4. Copy the deployed `razorpayWebhook` function URL from the deploy output into the Razorpay webhook settings. Subscribe to `payment.captured` and use the same webhook secret configured in Firebase.
5. Build and run a native app containing the Razorpay module:
   ```
   npx expo prebuild
   npx expo run:android
   ```
   Use an EAS development/production build if you do not build locally. Expo Go does not include the native Razorpay SDK.
6. Place a small test order using Razorpay's test payment details from its Dashboard documentation. The order is marked paid only after the server verifies the checkout signature and confirms the captured amount; the webhook also records captured payments if the app closes before returning from checkout.

The backend recomputes product prices and checks stock from Firestore; it does not trust the cart's prices or total. Admins cannot confirm a Razorpay order until its payment is verified. Gateway order records are retained as a payment audit trail and cannot be deleted. If payment completes while an order is being cancelled, the webhook still records it as paid so it can be reconciled; refunds remain manual.

## 6. Create the first admin (secure method)
Admin rights are a Firebase **custom claim** that only the Admin SDK can set. The app has no button, profile field, or local setting that can grant it.

1. Run the app (see the run guide) and **register** the account you want as admin.
2. In the console: **Project settings (gear) > Service accounts > Generate new private key**. Save the file as `firebase/setup/serviceAccountKey.json`.
   - This key is a master password for your project. It is git-ignored. Never put it in `src/`, never email it, never commit it.
3. In PowerShell:
```
cd firebase\setup
npm install
node set-admin.js you@example.com
```
4. In the app, **sign out and sign in again**. Profile now shows "Administrator" and an **Admin dashboard** row.
5. Optional: delete `serviceAccountKey.json` when finished (you can generate a new one later). To remove admin rights: `node set-admin.js you@example.com --revoke`.

For UPI, open the admin **Payments** tab and save the shop's UPI ID. Customers can then choose UPI at checkout. This is a direct UPI-app intent, not a payment gateway: admins must verify transfers manually before confirming orders.

## 7. Add demo products
Either use the app (Admin dashboard > Add product), or with the key from step 6:
```
cd firebase\setup
node seed-products.js           # adds 12 demo products (re-runnable)
node seed-products.js --remove  # removes them again
```
Demo images come from picsum.photos and need internet. Products with no image URL show a placeholder.

## Database structure
| Collection | Fields |
|---|---|
| `users/{uid}` | `email`, `displayName`, `phone`, `address`, `createdAt`. **No role field.** |
| `products/{id}` | `name`, `description`, `price` (number), `discountPercent` (number, 0-100), `category`, `imageUrl`, `stock` (integer), `createdAt`, `updatedAt` |
| `orders/{id}` | `userId`, `customerName`, `customerEmail`, `items[]` (`productId`, `name`, `price`, `quantity`, `imageUrl`), `total`, `status` (`pending` / `confirmed` / `shipped` / `delivered` / `cancelled`), `paymentMethod` (`COD` / `UPI` / `RAZORPAY`), `paymentStatus`, `paymentUpiId`, optional `razorpayOrderId` / `razorpayPaymentId`, `shippingAddress`, `phone`, `stockDeducted`, `createdAt`, `updatedAt` |
| `settings/payment` | `upiId`, `updatedAt`. Customers can read the configured UPI ID; only admins can change it. |

## What the rules enforce
- **Products:** any signed-in user can read; only admins can create, edit, or delete, with field and type checks. Product photos may be HTTPS URLs or compressed JPEG data URIs up to 650,000 characters.
- **Users:** you can read and edit only your own profile, and only name, phone, and address. Admins can read all. Nobody can delete.
- **Orders:** customers can create COD/UPI orders only for themselves with `pending` status and no stock deduction. UPI orders must use the configured UPI ID. Razorpay orders are created by authenticated Cloud Functions using server-side catalogue prices; only the payment-verification function can mark gateway orders paid. Customers can read only their own orders. Only admins can update order status / stock bookkeeping.
- **Payment settings:** signed-in customers can read the UPI ID; only admins can update it. Other settings documents are denied.

## Known limits (be aware)
- **Item prices inside an order cannot be verified by rules** (rules can't loop over a list). The app counters this: when an admin confirms an order it re-checks every price and the total against the catalogue and refuses on a mismatch. A customer who edits their own app could still *place* a bogus order, but it cannot be confirmed. Full prevention needs Cloud Functions (paid Blaze plan).
- **Stock** is deducted when an admin confirms an order, not when it is placed, so two customers can briefly order the last item. The second confirmation then fails with "Not enough stock".
- **UPI payments are manual:** the app opens an installed UPI app with the amount and order reference. An admin must verify the transfer in their UPI/bank account and mark it received before confirming the order.
- **Razorpay is test-mode only:** test credentials and a deployed Firebase Functions backend are required. Refunds and reconciliation for cancelled paid orders are not automated.
- **Browsing requires an account**, since product reads need sign-in. To allow guest browsing, change `allow read: if signedIn();` on `products` to `allow read: if true;` and add a guest path in the app.
- These rules were reviewed by hand and the app was type-checked and bundled, but I could not run the Firebase emulator here. Test them once with a real project (customer cannot open admin screens or see other orders; admin can).

## Firebase troubleshooting
| Symptom | Fix |
|---|---|
| "Dev-Com needs Firebase" screen | `.env` missing or still has `your-...` placeholders. Fill it, then `npx expo start -c`. |
| `auth/invalid-api-key` or `auth/configuration-not-found` | Wrong or missing `EXPO_PUBLIC_FIREBASE_API_KEY`, or Email/Password not enabled (step 3). |
| `permission-denied` everywhere | Rules not published (step 5), or the app is using a different project than the one you edited. |
| `permission-denied` only on admin screens | You haven't signed out and in since `set-admin.js`, or the email differs. |
| "The database needs a setup step" / `failed-precondition` | Firestore database not created yet (step 4). |
| Admin script: "Could not find the service account key" | Save the key at `firebase/setup/serviceAccountKey.json`. |
| Admin script: "No user with the email" | Register that account in the app first. |
| Device image does not save | Publish the latest Firestore rules (step 5); device images are stored in Firestore and do not require Firebase Storage. |
