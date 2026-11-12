# ටැබ්ලට් කළමනාකරණ පද්ධතිය — Firebase + GitHub Pages

ගොනු: `index.html`, `style.css`, `app.js`, `firebase-config.js`, `logo.jpg`, `firestore.rules`

## 1. Firebase Project
1. https://console.firebase.google.com → **Add project**
2. **Build → Authentication → Get started → Email/Password** enable කරන්න
3. Authentication → **Users → Add user** — භාවිතා කරන ගුරුවරුන්ගේ Email/Password සාදන්න
4. Authentication → **Settings → User actions** හි *Enable create (sign-up)* ඇත්නම් **off** කරන්න (අන් අය ගිණුම් සෑදීම වැළැක්වීමට)
5. **Build → Firestore Database → Create database** (production mode, region: `asia-south1`)
6. Firestore → **Rules** tab → `firestore.rules` හි අන්තර්ගතය paste කර **Publish**
7. **Project settings → Your apps → Web (</>)** → app එකක් register කර ලැබෙන `firebaseConfig` අගයන් `firebase-config.js` හි paste කරන්න

## 2. GitHub Pages
1. GitHub හි නව repository එකක් සාදා ගොනු සියල්ල upload කරන්න
2. **Settings → Pages → Branch: main / (root) → Save**
3. විනාඩි කිහිපයකින් `https://<username>.github.io/<repo>/` ලැබේ

## 3. පළමු වරට
Login වී **⚙️ වැඩිදුර → 🌱 ආරම්භක ටැබ් 49 ආයාත කරන්න** ඔබන්න (ST01–ST43, TH01–TH06).
පරණ v6 දත්ත තිබේ නම් **📥 දත්ත Import (JSON)** භාවිතා කරන්න.

## සටහන්
- Firebase `apiKey` public වීම සාමාන්‍යයි; ආරක්ෂාව Login + Firestore rules මගිනි.
- Internet නැති විටත් වැඩ කරයි; සම්බන්ධ වූ පසු ස්වයංක්‍රීයව sync වේ (header හි 🟢/🟠).
- ඡායාරූප ස්වයංක්‍රීයව කුඩා කරනු ලැබේ (Firestore document සීමාව නිසා).
- ST07 සහ ST22 ට එකම Tab/KB Serial ඇත — සත්‍ය අගය පරීක්ෂා කර Edit කරන්න.
