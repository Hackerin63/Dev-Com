import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { auth } from './firebase';
import { createUserProfile, getUserProfile } from './userService';

export async function registerWithEmail(name: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name.trim() });
  await createUserProfile(cred.user.uid, cred.user.email ?? email.trim(), name.trim());
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Makes sure users/{uid} exists (for example if the profile write failed during sign-up). */
export async function ensureProfile(user: User): Promise<void> {
  const existing = await getUserProfile(user.uid);
  if (!existing) {
    await createUserProfile(user.uid, user.email ?? '', user.displayName ?? '');
  }
}

/** Reads the admin flag from the signed-in user's verified ID token. Only the Admin SDK can set it. */
export async function readIsAdmin(user: User, forceRefresh: boolean): Promise<boolean> {
  try {
    const result = await getIdTokenResult(user, forceRefresh);
    return result.claims.admin === true;
  } catch {
    if (forceRefresh) {
      // Offline at start-up: fall back to the cached token.
      const cached = await getIdTokenResult(user, false);
      return cached.claims.admin === true;
    }
    return false;
  }
}
