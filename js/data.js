// Data layer: Firestore when Firebase is configured, otherwise a local demo (browser storage).
// Every page that needs orders / profile / reviews / returns imports from here.
import {
  getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { app, auth, configured } from './auth.js';

export const demo = !configured;
const db = configured ? getFirestore(app) : null;

export const STATUS_STEPS = ['new', 'confirmed', 'shipping', 'done'];
export function statusLabel(s) {
  return {
    new: tr('Đã đặt hàng', 'Order placed'), confirmed: tr('Đã xác nhận', 'Confirmed'),
    shipping: tr('Đang giao', 'Shipped'), done: tr('Đã giao', 'Delivered'), cancelled: tr('Đã hủy', 'Cancelled')
  }[s] || s;
}
export function returnStatusLabel(s) {
  return {
    requested: tr('Đã gửi yêu cầu', 'Requested'), approved: tr('Đã chấp nhận', 'Approved'),
    rejected: tr('Từ chối', 'Declined'), received: tr('Shop đã nhận hàng', 'Item received'),
    completed: tr('Hoàn tất', 'Completed')
  }[s] || s;
}
export function toDate(v) { return v && v.toDate ? v.toDate() : (v ? new Date(v) : null); }
export function trackingUrl(carrier, no) {
  if (!no) return null;
  const n = encodeURIComponent(no);
  return {
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`,
    ups: `https://www.ups.com/track?tracknum=${n}`,
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${n}`
  }[String(carrier || '').toLowerCase()] || null;
}

// ---------- user ----------
const DEMO_USER = { uid: 'demo', email: 'demo@baoanh.local', demo: true };

export function onUser(cb) {
  if (demo) { setTimeout(() => cb({ ...DEMO_USER, displayName: store.get('profile', {}).name || tr('Khách demo', 'Demo customer') })); return; }
  onAuthStateChanged(auth, cb);
}
export function currentUser() {
  if (demo) return { ...DEMO_USER, displayName: store.get('profile', {}).name || '' };
  return auth.currentUser;
}

// ---------- orders ----------
function orderNumber() { return 'BA' + Date.now().toString().slice(-6); }

export async function placeOrder(order) {
  const number = orderNumber();
  const user = currentUser();
  const full = { ...order, number, uid: user ? user.uid : null, status: 'new', stockApplied: false };
  if (demo) {
    const list = store.get('orders', []);
    const id = number;
    list.push({ ...full, id, createdAt: new Date().toISOString(), history: { new: new Date().toISOString() } });
    store.set('orders', list);
    return { id, number };
  }
  const ref = await addDoc(collection(db, 'orders'), { ...full, createdAt: serverTimestamp() });
  return { id: ref.id, number };
}

export async function myOrders() {
  const user = currentUser();
  if (!user) return [];
  if (demo) return store.get('orders', []).filter(o => o.uid === 'demo').map(o => ({ ...o })).reverse();
  const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', user.uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
}

// Demo only: move an order one step forward so the whole flow can be tried without the admin page
export function demoAdvance(id) {
  const list = store.get('orders', []);
  const o = list.find(x => x.id === id);
  if (!o) return;
  const i = STATUS_STEPS.indexOf(o.status);
  if (i < 0 || i >= STATUS_STEPS.length - 1) return;
  o.status = STATUS_STEPS[i + 1];
  o.history = { ...(o.history || {}), [o.status]: new Date().toISOString() };
  if (o.status === 'shipping' && o.delivery !== 'pickup') { o.carrier = 'USPS'; o.trackingNo = '[DEMO-TRACKING]'; }
  store.set('orders', list);
}

// ---------- profile & addresses ----------
export async function getProfile() {
  const user = currentUser();
  if (!user) return {};
  if (demo) return store.get('profile', {});
  const snap = await getDoc(doc(db, 'users', user.uid));
  return snap.exists() ? snap.data() : {};
}
export async function saveProfile(patch) {
  const user = currentUser();
  if (!user) return;
  if (demo) { store.set('profile', { ...store.get('profile', {}), ...patch }); return; }
  await setDoc(doc(db, 'users', user.uid), patch, { merge: true });
}

// ---------- reviews ----------
export async function getReviews(productId) {
  if (demo) return store.get('reviews', []).filter(r => r.productId === productId).reverse();
  const snap = await getDocs(query(collection(db, 'reviews'), where('productId', '==', productId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
}
export async function myReviewIds() {
  const user = currentUser();
  if (!user) return new Set();
  if (demo) return new Set(store.get('reviews', []).map(r => r.id));
  const snap = await getDocs(query(collection(db, 'reviews'), where('uid', '==', user.uid)));
  return new Set(snap.docs.map(d => d.id));
}
// One review per product per delivered order (id = orderId_productId)
export async function addReview({ orderId, productId, rating, text, size, name }) {
  const user = currentUser();
  const id = `${orderId}_${productId}`;
  const review = { orderId, productId, rating, text, size: size || '', name, uid: user.uid };
  if (demo) {
    const list = store.get('reviews', []);
    if (list.some(r => r.id === id)) throw new Error('exists');
    list.push({ ...review, id, createdAt: new Date().toISOString() });
    store.set('reviews', list);
    return;
  }
  await setDoc(doc(db, 'reviews', id), { ...review, createdAt: serverTimestamp() });
}

// ---------- returns / exchanges ----------
export async function requestReturn(req) {
  const user = currentUser();
  const full = { ...req, uid: user.uid, status: 'requested' };
  if (demo) {
    const list = store.get('returns', []);
    list.push({ ...full, id: 'R' + Date.now().toString().slice(-6), createdAt: new Date().toISOString() });
    store.set('returns', list);
    return;
  }
  await addDoc(collection(db, 'returns'), { ...full, createdAt: serverTimestamp() });
}
export async function myReturns() {
  const user = currentUser();
  if (!user) return [];
  if (demo) return store.get('returns', []).slice().reverse();
  const snap = await getDocs(query(collection(db, 'returns'), where('uid', '==', user.uid)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0));
}
