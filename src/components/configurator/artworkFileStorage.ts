/**
 * The artwork file that travels with a quote (the uploaded SVG/PDF, or the SVG generated from typed text) lives in
 * IndexedDB: sessionStorage cannot hold binary data of that size. One record, keyed by the quote it belongs to.
 * Everything here is best effort and never throws: a quote works the same without a file.
 */

/** Same cap as the uploader. */
export const MAX_ARTWORK_BYTES = 10 * 1024 * 1024;
/** A leftover file is forgotten after a day. */
export const ARTWORK_TTL_MS = 24 * 60 * 60 * 1000;
/** IndexedDB can hang (blocked upgrade, private modes); never keep the visitor waiting longer than this. */
const TIMEOUT_MS = 2500;

const DB_NAME = "sls-quote-files";
const STORE = "artwork";
const KEY = "current";

interface StoredArtwork {
  id: string;
  name: string;
  type: string;
  data: ArrayBuffer;
  savedAt: number;
}

function defaultFactory(): IDBFactory | null {
  try {
    return typeof indexedDB === "undefined" ? null : indexedDB;
  } catch {
    return null; // accessing it can throw when site data is blocked
  }
}

function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onblocked = () => reject(new Error("IndexedDB open blocked"));
  });
}

/** Runs one request in its own transaction; resolves once the transaction has committed. */
async function transact<T>(
  factory: IDBFactory,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb(factory);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });
  } finally {
    db.close();
  }
}

/** Resolves with `fallback` if the work fails or takes too long. */
async function guarded<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), TIMEOUT_MS);
  });
  try {
    return await Promise.race([work().catch(() => fallback), timeout]);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

/** Stores the file for quote `id`, replacing any earlier one. False if it is too big or could not be stored. */
export function saveArtworkFile(file: File, id: string, factory: IDBFactory | null = defaultFactory()): Promise<boolean> {
  if (!factory || file.size > MAX_ARTWORK_BYTES) return Promise.resolve(false);
  return guarded(async () => {
    const record: StoredArtwork = {
      id,
      name: file.name,
      type: file.type,
      data: await file.arrayBuffer(),
      savedAt: Date.now(),
    };
    await transact(factory, "readwrite", (store) => store.put(record, KEY));
    return true;
  }, false);
}

/** The file saved for quote `id`, or null (nothing saved, another quote's file, expired, or storage unavailable). */
export function loadArtworkFile(id: string, factory: IDBFactory | null = defaultFactory()): Promise<File | null> {
  if (!factory) return Promise.resolve(null);
  return guarded<File | null>(async () => {
    const record = await transact<StoredArtwork | undefined>(factory, "readonly", (store) => store.get(KEY));
    if (!record || record.id !== id) return null;
    if (Date.now() - record.savedAt > ARTWORK_TTL_MS) {
      await clearArtworkFile(factory);
      return null;
    }
    return new File([record.data], record.name, { type: record.type });
  }, null);
}

/** Forgets the stored file. */
export function clearArtworkFile(factory: IDBFactory | null = defaultFactory()): Promise<void> {
  if (!factory) return Promise.resolve();
  return guarded(async () => {
    await transact(factory, "readwrite", (store) => store.delete(KEY));
  }, undefined);
}
