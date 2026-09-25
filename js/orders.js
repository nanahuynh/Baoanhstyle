// Save a checkout order to Firestore (used by checkout.js when Firebase is configured)
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { app, auth, configured } from './auth.js';

export { configured };

export async function saveOrder(order) {
  const db = getFirestore(app);
  await addDoc(collection(db, 'orders'), {
    ...order,
    createdAt: serverTimestamp(),
    uid: auth.currentUser ? auth.currentUser.uid : null,
    status: 'new',
    stockApplied: false
  });
}
