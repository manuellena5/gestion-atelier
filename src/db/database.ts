import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { STORES, type Clienta, type Medida, type Pedido, type AppConfig, type SyncQueueItem } from './schema';

interface AtelierDB extends DBSchema {
  [STORES.CLIENTAS]: {
    key: string;
    value: Clienta;
    indexes: { nombre: string };
  };
  [STORES.MEDIDAS]: {
    key: string;
    value: Medida;
    indexes: { clientaId: string };
  };
  [STORES.PEDIDOS]: {
    key: string;
    value: Pedido;
    indexes: { clientaId: string; estado: string };
  };
  [STORES.CONFIG]: {
    key: string;
    value: AppConfig;
  };
  [STORES.SYNC_QUEUE]: {
    key: string;
    value: SyncQueueItem;
  };
}

const DB_NAME = 'gestion-atelier-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AtelierDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<AtelierDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AtelierDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.CLIENTAS)) {
          const clientasStore = db.createObjectStore(STORES.CLIENTAS, { keyPath: 'id' });
          clientasStore.createIndex('nombre', 'nombre');
        }
        if (!db.objectStoreNames.contains(STORES.MEDIDAS)) {
          const medidasStore = db.createObjectStore(STORES.MEDIDAS, { keyPath: 'id' });
          medidasStore.createIndex('clientaId', 'clientaId');
        }
        if (!db.objectStoreNames.contains(STORES.PEDIDOS)) {
          const pedidosStore = db.createObjectStore(STORES.PEDIDOS, { keyPath: 'id' });
          pedidosStore.createIndex('clientaId', 'clientaId');
          pedidosStore.createIndex('estado', 'estado');
        }
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG);
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await Promise.all([
    db.clear(STORES.CLIENTAS),
    db.clear(STORES.MEDIDAS),
    db.clear(STORES.PEDIDOS),
    db.clear(STORES.CONFIG),
    db.clear(STORES.SYNC_QUEUE),
  ]);
}
