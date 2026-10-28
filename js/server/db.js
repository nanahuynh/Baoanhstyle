// Data on our own server. Same function names the pages used with Firestore,
// so orders / inventory / ledger code did not need rewriting.
import { call } from './api.js';

const POLL_MS = 15000;
const watchers = new Set();

export function getFirestore() { return {}; }
export function collection(_db, col) { return { col }; }
export function doc(_db, col, id) { return { col, id }; }
export function where(field, op, value) {
  if (op !== '==') throw new Error('Only == is supported');
  return { where: [field, value] };
}
export function orderBy(field, dir = 'asc') { return { orderBy: [field, dir] }; }
export function query(ref, ...parts) {
  const q = { col: ref.col, where: [], orderBy: null };
  parts.forEach(p => { if (p.where) q.where.push(p.where); if (p.orderBy) q.orderBy = p.orderBy; });
  return q;
}
export function serverTimestamp() { return { __sv: 'now' }; }

function docSnap(id, data) {
  return { id, exists: () => data != null, data: () => (data == null ? undefined : data) };
}
function querySnap(docs) {
  const list = docs.map(d => docSnap(d.id, d.data));
  return { docs: list, size: list.length, empty: !list.length, forEach: f => list.forEach(f) };
}

export async function getDoc(ref) {
  const { doc: d } = await call('get', { col: ref.col, id: ref.id });
  return docSnap(ref.id, d ? d.data : null);
}
export async function getDocs(q) {
  const { docs } = await call('list', { col: q.col, where: q.where || [], orderBy: q.orderBy || null });
  return querySnap(docs);
}

function changed() { watchers.forEach(w => w.run()); }

export async function addDoc(ref, data) {
  const { id } = await call('add', { col: ref.col, data });
  changed();
  return { id };
}
export async function setDoc(ref, data, opts = {}) {
  await call('set', { col: ref.col, id: ref.id, data, merge: !!opts.merge });
  changed();
}
export async function updateDoc(ref, data) {
  await call('update', { col: ref.col, id: ref.id, data });
  changed();
}
export async function deleteDoc(ref) {
  await call('delete', { col: ref.col, id: ref.id });
  changed();
}

// Live list: refreshes every 15 s, and right after any change made from this page.
export function onSnapshot(q, next, onError) {
  let stopped = false;
  const w = {
    run: () => getDocs(q).then(s => { if (!stopped) next(s); }, e => { if (!stopped && onError) onError(e); })
  };
  watchers.add(w);
  w.run();
  const timer = setInterval(() => { if (!document.hidden) w.run(); }, POLL_MS);
  return () => { stopped = true; clearInterval(timer); watchers.delete(w); };
}

// Reads go straight to the server; writes are sent together and saved all-or-nothing.
export async function runTransaction(_db, fn) {
  const ops = [];
  const tx = {
    get: ref => getDoc(ref),
    set: (ref, data, opts = {}) => { ops.push({ op: 'set', col: ref.col, id: ref.id, data, merge: !!opts.merge }); return tx; },
    update: (ref, data) => { ops.push({ op: 'update', col: ref.col, id: ref.id, data }); return tx; },
    delete: ref => { ops.push({ op: 'delete', col: ref.col, id: ref.id }); return tx; }
  };
  const result = await fn(tx);
  if (ops.length) { await call('batch', { ops }); changed(); }
  return result;
}
