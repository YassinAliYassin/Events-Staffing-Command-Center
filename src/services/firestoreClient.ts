/**
 * Firestore-backed cloud store for FPCC.
 * Replaces the former Supabase client. All-Google: Firebase Firestore.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-config.json';

let db: Firestore | null = null;

try {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);
  db = getFirestore(app);
} catch (e) {
  console.warn('Firestore init failed; using local store only.', e);
  db = null;
}

export const firestore = db;
export const isFirestoreEnabled = () => !!db;

const SYNC_TABLES = ['staff', 'clients', 'events', 'invoices', 'quotes'] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

/** Upsert every row of each table into its Firestore collection. */
export const pushTables = async (data: Record<string, any[]>) => {
  if (!db) return;
  for (const table of SYNC_TABLES) {
    const rows = data[table] || [];
    if (!rows.length) continue;
    // Batch writes (max 500 per batch).
    for (let i = 0; i < rows.length; i += 450) {
      const batch = writeBatch(db);
      for (const row of rows.slice(i, i + 450)) {
        if (row?.id == null) continue;
        const ref = doc(db, table, String(row.id));
        batch.set(ref, row, { merge: true });
      }
      await batch.commit();
    }
  }
};

/** Read every collection back into a plain object. */
export const pullTables = async (): Promise<Record<SyncTable, any[]> | null> => {
  if (!db) return null;
  const out = {} as Record<SyncTable, any[]>;
  for (const table of SYNC_TABLES) {
    const snap = await getDocs(collection(db, table));
    out[table] = snap.docs.map((d) => d.data());
  }
  return out;
};

export const SYNC_TABLE_LIST = SYNC_TABLES;
