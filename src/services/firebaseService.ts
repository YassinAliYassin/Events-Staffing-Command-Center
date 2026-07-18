import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  enableIndexedDbPersistence,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    enableIndexedDbPersistence(db).catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab');
      } else if (err.code === 'unimplemented') {
        console.warn("Browser doesn't support persistence");
      }
    });
  } catch (err) {
    console.warn('Firebase init failed — running local-only:', err);
    app = null;
    db = null;
  }
} else {
  console.info('Firebase not configured — ESCC running on localStorage fallback');
}

// Staff operations
export async function getStaff() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'staff'), orderBy('id')));
  return snapshot.docs.map(d => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

export async function upsertStaff(staff: any) {
  if (!db) return;
  const ref = doc(db, 'staff', String(staff.id));
  await setDoc(ref, staff, { merge: true });
}

// Client operations
export async function getClients() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'clients'), orderBy('id')));
  return snapshot.docs.map(d => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

export async function upsertClient(client: any) {
  if (!db) return;
  const ref = doc(db, 'clients', String(client.id));
  await setDoc(ref, client, { merge: true });
}

// Event operations
export async function getEvents() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'events'), orderBy('date')));
  return snapshot.docs.map(d => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

export async function upsertEvent(event: any) {
  if (!db) return;
  const ref = doc(db, 'events', String(event.id));
  await setDoc(ref, event, { merge: true });
}

// Invoice operations
export async function getInvoices() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'invoices'), orderBy('id')));
  return snapshot.docs.map(d => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

export async function upsertInvoice(invoice: any) {
  if (!db) return;
  const ref = doc(db, 'invoices', String(invoice.id));
  await setDoc(ref, invoice, { merge: true });
}

// Quote operations
export async function getQuotes() {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, 'quotes'), orderBy('id')));
  return snapshot.docs.map(d => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

export async function upsertQuote(quote: any) {
  if (!db) return;
  const ref = doc(db, 'quotes', String(quote.id));
  await setDoc(ref, quote, { merge: true });
}
