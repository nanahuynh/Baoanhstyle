// Accounts on our own server. Same function names the pages used with Firebase Auth.
import { call } from './api.js';

const listeners = new Set();
const auth = { currentUser: null, languageCode: 'vi' };
let loaded = null;
let ready = false;

function makeUser(u) {
  if (!u) return null;
  return {
    ...u,
    emailVerified: true,
    metadata: { creationTime: u.created },
    reload: async () => { await refresh(); },
    getIdToken: async () => ''
  };
}
function setUser(u) {
  auth.currentUser = makeUser(u);
  ready = true;
  listeners.forEach(cb => cb(auth.currentUser));
  return auth.currentUser;
}
async function refresh() {
  const { user } = await call('me');
  return setUser(user);
}
function load() {
  if (!loaded) loaded = refresh().catch(() => setUser(null));
  return loaded;
}

export function getAuth() { load(); return auth; }

export function onAuthStateChanged(_auth, cb) {
  listeners.add(cb);
  if (ready) Promise.resolve().then(() => { if (listeners.has(cb)) cb(auth.currentUser); });
  else load();
  return () => listeners.delete(cb);
}

export async function signInWithEmailAndPassword(_auth, email, password) {
  const { user } = await call('signin', { email, password });
  return { user: setUser(user) };
}
export async function createUserWithEmailAndPassword(_auth, email, password) {
  const { user } = await call('signup', { email, password });
  return { user: setUser(user) };
}
export async function updateProfile(_user, { displayName }) {
  const { user } = await call('profile', { displayName });
  setUser(user);
}
export async function sendPasswordResetEmail(_auth, email) {
  await call('reset', { email });
}
export async function signOut() {
  await call('signout');
  setUser(null);
}
// Accounts need no email verification on our server
export async function sendEmailVerification() {}
