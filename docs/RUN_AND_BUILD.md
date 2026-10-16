# Dev-Com: run locally, test on Android, build an APK (Windows)

Do `docs/FIREBASE_SETUP.md` steps 1-5 first (Firebase project, `.env`, sign-in, database, rules).

## 1. Install the tools (once)
1. **Node.js LTS** (version 20 or newer) from https://nodejs.org. Check in PowerShell: `node -v`
2. **Expo Go** on your Android phone (Google Play Store). Keep it updated; it must support Expo SDK 57.
3. A free **Expo account** at https://expo.dev (needed only for the APK build).

## 2. Install and run
Open PowerShell in the project folder (`dev-com`):
```
npm install
npx expo start
```
A QR code appears. On your phone open **Expo Go > Scan QR code**. Your phone and PC must be on the **same Wi-Fi**.
If the phone can't connect, use `npx expo start --tunnel` (it may ask to install a helper; answer `y`).

Other useful commands:
```
npx expo start -c      # clear cache (use after editing .env)
npm run typecheck      # TypeScript check
npm run lint           # lint
```

## 3. Test checklist
**Customer (any normal account)**
1. Register, then sign in. Close and reopen Expo Go: you stay signed in.
2. Home: search, category chips, light/dark toggle (sun/moon button).
3. Open a product, add to cart, change quantity in Cart. Close and reopen: the cart persists.
4. Checkout (Cash on Delivery) with name, phone, address. You land on the order page; it appears under Orders as **Pending**.
5. Profile: edit details, open Settings and switch theme, sign out.
6. As a customer you must see **no** Admin row in Profile.

**Admin** (after `docs/FIREBASE_SETUP.md` step 6, then sign out/in)
1. Profile > **Admin dashboard**: counts for products, orders, users, pending.
2. Products: add, edit, delete one.
3. Orders: open your test order, **Mark confirmed** (stock drops), then shipped, then delivered. Try Cancel on another one.
4. Users: your accounts are listed.

**Security spot-check:** sign in as a normal customer, and confirm you can't see other people's orders and that the Admin row is absent. For a stronger test, in the Firebase console Rules tab use the **Rules Playground** to simulate a signed-in non-admin writing to `products` (it should be denied).

## 4. Build a standalone APK with EAS
`eas.json` already has a `preview` profile that produces an **APK** (the `production` profile makes an app bundle for the Play Store instead, which can't be installed directly).

```
npx eas-cli login
npx eas-cli init
npx eas-cli env:push preview --path .env
npx eas-cli build --platform android --profile preview
```
What each does:
1. `login`: sign in with your Expo account.
2. `init`: creates/links the EAS project (it adds a project ID to `app.json`; accept the prompts).
3. `env:push`: uploads your Firebase values from `.env` to EAS. **This step is essential.** `.env` is git-ignored, so without it the APK would build with no Firebase config and show the "needs Firebase" screen.
4. `build`: when asked, let EAS **generate a new Android keystore**. Build time is usually 10-25 minutes on the free queue. You can close the terminal; the build continues on Expo's servers.

When it finishes, the terminal and https://expo.dev (your project > Builds) show a link and QR code to the `.apk`.
**Keep your keystore** (EAS stores it for you; `npx eas-cli credentials` can download a backup). Future updates must use the same one.

## 5. Install and test the APK
1. On your phone, open the build page link (or scan the QR) and download the `.apk`.
2. Open the file. If Android blocks it, allow **Install unknown apps** for your browser or Files app when prompted, then install.
3. Open **Dev-Com** and repeat the test checklist. Sign-in, cart, orders, and admin should behave exactly as in Expo Go.
4. Optional, USB install with developer mode on: `adb install path\to\app.apk`.

If you later change `.env`, run `npx eas-cli env:push preview --path .env --force` again before rebuilding.

## 6. Common errors on Windows
| Problem | Fix |
|---|---|
| `npm.ps1 cannot be loaded because running scripts is disabled` | PowerShell as your user: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or use Command Prompt (cmd). |
| `node` / `npx` not recognized | Reinstall Node.js LTS and reopen the terminal. |
| `eas` not recognized | Use `npx eas-cli ...` as in this guide (no global install needed). |
| Phone can't load the app from the QR code | Same Wi-Fi? Allow Node.js through Windows Firewall on **Private** networks, or use `npx expo start --tunnel`. |
| `Port 8081 is being used` | Answer `y` to use another port, or close the other Expo/Metro window. |
| Red screen "Unable to resolve module ..." | `npm install`, then `npx expo start -c`. |
| Expo Go says the project is incompatible with its version | Update Expo Go from the Play Store (this project uses SDK 57). |
| "Dev-Com needs Firebase" screen | Fix `.env` (no `your-...` values, no quotes), then `npx expo start -c`. In the APK: run `env:push` and rebuild. |
| `Component auth has not been registered yet` | Clear cache with `npx expo start -c`; make sure `npm install` finished without errors. |
| `permission-denied` | See the Firebase troubleshooting table in `docs/FIREBASE_SETUP.md`. |
| Build fails: "Install dependencies" | Run `npm install` locally first and make sure `package-lock.json` is committed or present, then rebuild. Open the build's log on expo.dev for the exact error. |
| Build fails: "Run gradlew" | Open that log section on expo.dev. Run `npx expo-doctor` locally; fix anything it reports and rebuild. |
| Build fails: invalid or duplicate application ID | In `app.json`, change `android.package` (currently `com.devcom.shop`) to something unique, such as `com.yourname.devcom`. |
| Android refuses to install ("App not installed") | Uninstall any older Dev-Com first, then install again. |
| Long-path or permission errors on `npm install` | Keep the project in a short path such as `C:\dev\dev-com`, and avoid OneDrive-synced folders. |
