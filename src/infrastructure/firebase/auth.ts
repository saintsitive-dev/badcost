import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  let user: User;

  if (import.meta.env.DEV) {
    // In dev mode with emulators, use a test credential
    const credential = GoogleAuthProvider.credential(
      JSON.stringify({ sub: 'dev-host-uid', email: 'host@dev.local', name: 'Dev Host' })
    );
    const result = await signInWithCredential(auth, credential);
    user = result.user;
  } else {
    const result = await signInWithPopup(auth, googleProvider);
    user = result.user;
  }

  await saveHostProfile(user);
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

async function saveHostProfile(user: User): Promise<void> {
  const hostRef = doc(db, 'hosts', user.uid);
  await setDoc(hostRef, {
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    provider: 'google',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
