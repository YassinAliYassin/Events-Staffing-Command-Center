import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, orderBy, enableIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser doesn\'t support persistence');
  }
});

// Staff operations
export async function getStaff() {
  const snapshot = await getDocs(query(collection(db, 'staff'), orderBy('id')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function upsertStaff(staff) {
  const ref = doc(db, 'staff', String(staff.id));
  await setDoc(ref, staff, { merge: true });
}

// Client operations
export async function getClients() {
  const snapshot = await getDocs(query(collection(db, 'clients'), orderBy('id')));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function upsertClient(client) {
  const ref = doc(db, 'clients', String(client.id));
  await setDoc(ref, client, { merge: true });
}

// Event operations
export async function getEvents() {
  const snapshot = await getDocs(query(collection(db, 'events'), orderBy('date')));
  return snapshot.docs.map(doc => ({ id: doc.data().id, ...doc.data() }));
}

export async function upsertEvent(event) {
  const ref = doc(db, 'events', event.id);
  await setDoc(ref, event, { merge: true });
}

// Invoice operations
export async function getInvoices() {
  const snapshot = await getDocs(query(collection(db, 'invoices'), orderBy('id')));
  return snapshot.docs.map(doc => ({ id: doc.data().id, ...doc.data() }));
}

export async function upsertInvoice(invoice) {
  const ref = doc(db, 'invoices', String(invoice.id));
  await setDoc(ref, invoice, { merge: true });
}

// Quote operations
export async function getQuotes() {
  const snapshot = await getDocs(query(collection(db, 'quotes'), orderBy('id')));
  return snapshot.docs.map(doc => ({ id: doc.data().id, ...doc.data() }));
}

export async function upsertQuote(quote) {
  const ref = doc(db, 'quotes', String(quote.id));
  await setDoc(ref, quote, { merge: true });
}