// Grants (or removes) the "admin" custom claim for one existing user.
//
//   node set-admin.js you@example.com           -> make admin
//   node set-admin.js you@example.com --revoke  -> remove admin
//
// The user must already have registered in the app. After running this, they must sign out and
// sign in again in the app so their new ID token carries the claim.
const { init } = require('./admin-init');
const { getAuth } = require('firebase-admin/auth');

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes('--revoke');
  if (!email || email.startsWith('--')) {
    console.error('Usage: node set-admin.js <email> [--revoke]');
    process.exit(1);
  }

  init();
  const auth = getAuth();

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (e) {
    if (e && e.code === 'auth/user-not-found') {
      console.error(`No user with the email ${email}. Register that account in the app first, then run this again.`);
      process.exit(1);
    }
    throw e;
  }

  const claims = { ...(user.customClaims || {}) };
  if (revoke) delete claims.admin;
  else claims.admin = true;

  await auth.setCustomUserClaims(user.uid, claims);
  if (revoke) await auth.revokeRefreshTokens(user.uid); // forces a fresh sign-in

  console.log(revoke ? `Removed admin access from ${email}.` : `${email} is now an admin.`);
  console.log('Ask them to sign out and sign in again in the app for the change to apply.');
}

main().catch((e) => {
  console.error('Failed:', e && e.message ? e.message : e);
  process.exit(1);
});
