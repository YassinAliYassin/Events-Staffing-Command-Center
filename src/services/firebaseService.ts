import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

type FirestoreDb = import('firebase/firestore').Firestore;

let dbPromise: Promise<FirestoreDb | null> | null = null;

/** Firestore loads in its own chunk, after first paint, and only when configured. */
export function getDb(): Promise<FirestoreDb | null> {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (!dbPromise) dbPromise = initDb();
  return dbPromise;
}

async function initDb(): Promise<FirestoreDb | null> {
  try {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, enableIndexedDbPersistence } = await import('firebase/firestore');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    enableIndexedDbPersistence(db).catch(() => {});
    return db;
  } catch (err) {
    console.warn('Firebase init failed — running local-only:', err);
    return null;
  }
}

async function api() {
  const db = await getDb();
  if (!db) return null;
  const firestore = await import('firebase/firestore');
  return { db, ...firestore };
}

async function readAll(name: string, order: string) {
  const store = await api();
  if (!store) return [];
  const snapshot = await store.getDocs(store.query(store.collection(store.db, name), store.orderBy(order)));
  return snapshot.docs.map((d) => ({ id: Number(d.data().id) || d.id, ...d.data() }));
}

async function write(name: string, record: any) {
  const store = await api();
  if (!store || record?.id == null) return;
  await store.setDoc(store.doc(store.db, name, String(record.id)), record, { merge: true });
}

export const getStaff = () => readAll('staff', 'id');
export const upsertStaff = (staff: any) => write('staff', staff);
export const getClients = () => readAll('clients', 'id');
export const upsertClient = (client: any) => write('clients', client);
export const getEvents = () => readAll('events', 'date');
export const upsertEvent = (event: any) => write('events', event);
export const getInvoices = () => readAll('invoices', 'id');
export const upsertInvoice = (invoice: any) => write('invoices', invoice);
export const getQuotes = () => readAll('quotes', 'id');
export const upsertQuote = (quote: any) => write('quotes', quote);
