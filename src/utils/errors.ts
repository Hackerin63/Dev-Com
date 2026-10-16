const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address is not valid.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account exists with that email.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'permission-denied': 'You do not have permission to do that.',
  unavailable: 'The server is unreachable. Check your connection and try again.',
  'not-found': 'That item no longer exists.',
  'failed-precondition': 'The database needs a setup step. Check the setup guide.',
};

/** Turns any thrown value into a message that is safe to show to a customer. */
export function friendlyError(error: unknown): string {
  if (error && typeof error === 'object') {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      const key = code.replace(/^firestore\//, '');
      if (MESSAGES[code]) return MESSAGES[code];
      if (MESSAGES[key]) return MESSAGES[key];
    }
    if (error instanceof Error && !('code' in error)) return error.message;
  }
  return 'Something went wrong. Please try again.';
}
