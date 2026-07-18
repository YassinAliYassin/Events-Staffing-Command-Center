import { db, getStaff, upsertStaff as firebaseUpsertStaff, getClients, upsertClient as firebaseUpsertClient, getEvents, upsertEvent as firebaseUpsertEvent, getInvoices, upsertInvoice as firebaseUpsertInvoice, getQuotes, upsertQuote as firebaseUpsertQuote } from './firebaseService';

// ─── Local storage fallback (primary source of truth offline) ────────────────
const KEY = 'escc_local_store_v1';

interface LocalStore {
  staff: any[];
  clients: any[];
  events: any[];
  invoices: any[];
  quotes: any[];
  messages: any[];
  records: any[]; // timesheet clock in/out
}

const DEFAULT_STAFF = [
  { id: 1, name: "Amara Diallo", role: "Bar Staff", rate: 40, pin: "1111", uniform: true, department: "Bar", email: "amara@freshpeople.co.za", phone: "+27 71 001 0001" },
  { id: 2, name: "Themba Nkosi", role: "Floor Staff", rate: 40, pin: "2222", uniform: true, department: "Floor", email: "themba@freshpeople.co.za", phone: "+27 71 001 0002" },
  { id: 3, name: "Priya Moodley", role: "Supervisor", rate: 55, pin: "3333", uniform: false, department: "Management", email: "priya@freshpeople.co.za", phone: "+27 71 001 0003" },
  { id: 4, name: "Lerato Khumalo", role: "Bar Staff", rate: 40, pin: "4444", uniform: true, department: "Bar", email: "lerato@freshpeople.co.za", phone: "+27 71 001 0004" },
  { id: 5, name: "Sipho Dlamini", role: "Security", rate: 45, pin: "5555", uniform: true, department: "Security", email: "sipho@freshpeople.co.za", phone: "+27 71 001 0005" },
  { id: 6, name: "Naledi Tau", role: "Floor Staff", rate: 40, pin: "6666", uniform: false, department: "Floor", email: "naledi@freshpeople.co.za", phone: "+27 71 001 0006" },
];

const seedStore = (): LocalStore => {
  const today = new Date();
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  return {
    staff: DEFAULT_STAFF,
    clients: [
      { id: 1, name: "Sandton Events Co", contactPerson: "Ops Desk", email: "ops@sandtonevents.co.za", vatNo: "4130265178", address: "14 Maude St, Sandton, 2196", phone: "+27 11 555 0100", hourlyRate: 90, status: "active" },
      { id: 2, name: "MTN Group Ltd", contactPerson: "Procurement", email: "procurement@mtn.com", vatNo: "4000109388", address: "216 14th Ave, Fairland, 2195", phone: "+27 11 912 3000", hourlyRate: 120, status: "vip" },
      { id: 3, name: "Priya & Dev Khumalo", contactPerson: "Priya Khumalo", email: "priya.khumalo@gmail.com", vatNo: "", address: "Private, KwaZulu-Natal", phone: "+27 82 333 0001", hourlyRate: 95, status: "active" },
    ],
    events: [
      { id: 1, title: "Sandton Jazz Festival", date: ymd(addDays(today, 2)), venue: "Sandton Convention Centre", staffIds: [1, 2, 5], startTime: "17:00", endTime: "23:00", clientId: 1, color: "#00e5a0", notes: "Smart dress code." },
      { id: 2, title: "Corporate Gala — MTN", date: ymd(addDays(today, 5)), venue: "Hyatt Regency JHB", staffIds: [3, 4, 6], startTime: "18:00", endTime: "22:00", clientId: 2, color: "#7c6af7", notes: "Formal." },
      { id: 3, title: "Wedding: Khumalo/Singh", date: ymd(addDays(today, 8)), venue: "Zimbali Estate", staffIds: [1, 2, 3, 4], startTime: "12:00", endTime: "20:00", clientId: 3, color: "#f78c6c", notes: "Outdoor." },
    ],
    invoices: [
      { id: 1, docNo: "ESCC-INV-2026-001", type: "invoice", clientId: 2, eventId: 2, issueDate: ymd(addDays(today, -2)), dueDate: ymd(addDays(today, 28)), status: "sent", includeTax: true, taxRate: 15, lines: [{ desc: "Floor Staff × 3 (5h)", qty: 15, rate: 40 }, { desc: "Supervision fee", qty: 1, rate: 500 }], notes: "Thank you." },
    ],
    quotes: [
      { id: 1, docNo: "ESCC-QTE-2026-001", clientId: 1, eventId: 1, issueDate: ymd(today), validUntil: ymd(addDays(today, 30)), status: "draft", includeTax: true, taxRate: 15, lines: [{ desc: "Bar Staff × 3 (6h)", qty: 18, rate: 40 }, { desc: "Security × 2 (6h)", qty: 12, rate: 45 }, { desc: "Setup fee", qty: 1, rate: 800 }], notes: "Valid for 30 days." },
    ],
    messages: [],
    records: [],
  };
};

const normalizeStore = (raw: any): LocalStore => {
  const seed = seedStore();
  return {
    staff: Array.isArray(raw?.staff) ? raw.staff : seed.staff,
    clients: Array.isArray(raw?.clients) ? raw.clients : seed.clients,
    events: Array.isArray(raw?.events) ? raw.events : seed.events,
    invoices: Array.isArray(raw?.invoices) ? raw.invoices : seed.invoices,
    quotes: Array.isArray(raw?.quotes) ? raw.quotes : seed.quotes,
    messages: Array.isArray(raw?.messages) ? raw.messages : [],
    records: Array.isArray(raw?.records) ? raw.records : [],
  };
};

const loadLocal = (): LocalStore => {
  if (typeof localStorage === 'undefined') return seedStore();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const fresh = seedStore();
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch {}
    return fresh;
  }
  try {
    return normalizeStore(JSON.parse(raw));
  } catch {
    return seedStore();
  }
};

const saveLocal = (s: LocalStore) => {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  }
};

const nextId = (arr: { id?: number }[]) =>
  (arr.length ? Math.max(...arr.map(x => Number(x.id) || 0)) : 0) + 1;

// Firestore sync (best-effort — never blocks local writes)
const syncToFirestore = async (s: LocalStore) => {
  if (!db) return;
  try {
    for (const staff of s.staff) await firebaseUpsertStaff(staff);
    for (const client of s.clients) await firebaseUpsertClient(client);
    for (const event of s.events) await firebaseUpsertEvent(event);
    for (const invoice of s.invoices) await firebaseUpsertInvoice(invoice);
    for (const quote of s.quotes) await firebaseUpsertQuote(quote);
  } catch (err) {
    console.warn('Firestore sync error:', err);
  }
};

// ─── Public service API ──────────────────────────────────────────────────────
const store = loadLocal();

const update = (mutator: (s: LocalStore) => void): LocalStore => {
  mutator(store);
  saveLocal(store);
  syncToFirestore(store).catch(e => console.warn('Firestore sync failed', e));
  return store;
};

// Staff
export const listStaff = () => store.staff;
export const addStaff = (s: any) => {
  const id = nextId(store.staff);
  return update(st => { st.staff = [...st.staff, { ...s, id }]; }).staff.find(x => x.id === id);
};
export const updateStaff = (id: number, patch: any) => {
  return update(st => { st.staff = st.staff.map(x => x.id === id ? { ...x, ...patch } : x); }).staff.find(x => x.id === id);
};
export const deleteStaff = (id: number) => {
  update(st => { st.staff = st.staff.filter(x => x.id !== id); });
  return true;
};

// Clients
export const listClients = () => store.clients;
export const addClient = (c: any) => {
  const id = nextId(store.clients);
  return update(st => {
    st.clients = [...st.clients, { ...c, id, hourlyRate: c.hourlyRate ?? 90, status: c.status ?? 'active' }];
  }).clients.find(x => x.id === id);
};
export const updateClient = (id: number, patch: any) => {
  return update(st => { st.clients = st.clients.map(x => x.id === id ? { ...x, ...patch } : x); }).clients.find(x => x.id === id);
};
export const deleteClient = (id: number) => {
  update(st => { st.clients = st.clients.filter(x => x.id !== id); });
  return true;
};

// Events
export const listEvents = () => store.events;
export const addEvent = (e: any) => {
  const id = nextId(store.events);
  return update(st => { st.events = [...st.events, { ...e, id }]; }).events.find(x => x.id === id);
};
export const updateEvent = (id: number, patch: any) => {
  return update(st => { st.events = st.events.map(x => x.id === id ? { ...x, ...patch } : x); }).events.find(x => x.id === id);
};
export const deleteEvent = (id: number) => {
  update(st => { st.events = st.events.filter(x => x.id !== id); });
  return true;
};

// Invoices
export const listInvoices = () => store.invoices;
export const addInvoice = (inv: any) => {
  const id = nextId(store.invoices);
  const docNo = inv.docNo || `ESCC-INV-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
  const record = { ...inv, id, docNo, type: 'invoice' };
  return update(st => { st.invoices = [...st.invoices, record]; }).invoices.find(x => x.id === id);
};
export const updateInvoice = (id: number, patch: any) => {
  return update(st => { st.invoices = st.invoices.map(x => x.id === id ? { ...x, ...patch } : x); }).invoices.find(x => x.id === id);
};
export const deleteInvoice = (id: number) => {
  update(st => { st.invoices = st.invoices.filter(x => x.id !== id); });
  return true;
};

// Quotes
export const listQuotes = () => store.quotes;
export const addQuote = (q: any) => {
  const id = nextId(store.quotes);
  const docNo = q.docNo || `ESCC-QTE-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
  const record = { ...q, id, docNo, type: 'quote' };
  return update(st => { st.quotes = [...st.quotes, record]; }).quotes.find(x => x.id === id);
};
export const updateQuote = (id: number, patch: any) => {
  return update(st => { st.quotes = st.quotes.map(x => x.id === id ? { ...x, ...patch } : x); }).quotes.find(x => x.id === id);
};
export const deleteQuote = (id: number) => {
  update(st => { st.quotes = st.quotes.filter(x => x.id !== id); });
  return true;
};
export const convertQuoteToInvoice = (quoteId: number) => {
  const q = store.quotes.find(x => x.id === quoteId);
  if (!q) return null;
  updateQuote(quoteId, { status: 'accepted' });
  return addInvoice({
    clientId: q.clientId,
    eventId: q.eventId,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'sent',
    lines: q.lines,
    notes: q.notes,
    includeTax: q.includeTax,
    taxRate: q.taxRate,
  });
};

// Messages (for WhatsApp)
export const addMessage = (m: any) => {
  const id = nextId(store.messages);
  return update(st => {
    st.messages = [...st.messages, { ...m, id, createdAt: new Date().toISOString() }];
  }).messages.find(x => x.id === id);
};
export const listMessages = () => store.messages;

// Timesheet records (clock in/out)
export const listRecords = () => store.records;
export const clockIn = (staffId: number) => {
  const open = store.records.find(r => r.staffId === staffId && !r.clockOut);
  if (open) return open;
  const id = nextId(store.records);
  return update(st => {
    st.records = [...st.records, { id, staffId, clockIn: Date.now(), clockOut: null }];
  }).records.find(x => x.id === id);
};
export const clockOut = (staffId: number) => {
  const open = store.records.find(r => r.staffId === staffId && !r.clockOut);
  if (!open) return null;
  return update(st => {
    st.records = st.records.map(r =>
      r.staffId === staffId && !r.clockOut ? { ...r, clockOut: Date.now() } : r
    );
  }).records.find(x => x.id === open.id);
};

// Sync from Firestore (call on app init) — only merges non-empty remote collections
export async function syncFromFirestore() {
  if (!db) return;

  try {
    const [staff, clients, events, invoices, quotes] = await Promise.all([
      getStaff(),
      getClients(),
      getEvents(),
      getInvoices(),
      getQuotes()
    ]);

    // Never wipe local seed with empty remote (common with placeholder Firebase)
    const merged = {
      ...store,
      staff: staff?.length ? staff : store.staff,
      clients: clients?.length ? clients : store.clients,
      events: events?.length ? events : store.events,
      invoices: invoices?.length ? invoices : store.invoices,
      quotes: quotes?.length ? quotes : store.quotes,
      records: store.records,
      messages: store.messages,
    };
    saveLocal(merged);
    Object.assign(store, merged);
  } catch (err) {
    console.warn('Firestore sync from error:', err);
  }
}

export const resetStore = () => {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  const fresh = seedStore();
  saveLocal(fresh);
  Object.assign(store, fresh);
  return fresh;
};

export const getSnapshot = () => ({ ...store, staff: [...store.staff], clients: [...store.clients], events: [...store.events], invoices: [...store.invoices], quotes: [...store.quotes], records: [...store.records], messages: [...store.messages] });
