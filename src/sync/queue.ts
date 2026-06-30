import { nanoid } from 'nanoid';
import { getDb } from '../db/database';
import { STORES, type SyncQueueItem, type SyncAction, type Clienta, type Pedido, type Medida } from '../db/schema';
import { getConfig, updateConfig } from '../db/configDb';
import { syncClienta, syncPedido, syncMedida } from './appsScript';

export async function enqueueSync(
  action: SyncAction,
  payload: Clienta | Pedido | Medida
): Promise<void> {
  try {
    const db = await getDb();
    const item: SyncQueueItem = {
      id: nanoid(),
      action,
      payload,
      createdAt: new Date().toISOString(),
    };
    await db.add(STORES.SYNC_QUEUE, item);
  } catch (error) {
    throw new Error(`No se pudo encolar la sincronización: ${String(error)}`);
  }
}

async function dispatchSyncItem(url: string, item: SyncQueueItem): Promise<void> {
  switch (item.action) {
    case 'syncClientas':
      await syncClienta(url, item.payload as Clienta);
      return;
    case 'syncPedidos':
      await syncPedido(url, item.payload as Pedido);
      return;
    case 'syncMedidas':
      await syncMedida(url, item.payload as Medida);
      return;
  }
}

export async function flushSyncQueue(): Promise<{ ok: number; failed: number }> {
  const config = await getConfig();
  if (!config.appsScriptUrl) {
    return { ok: 0, failed: 0 };
  }

  const db = await getDb();
  const items = await db.getAll(STORES.SYNC_QUEUE);
  let ok = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await dispatchSyncItem(config.appsScriptUrl, item);
      await db.delete(STORES.SYNC_QUEUE, item.id);
      ok += 1;
    } catch {
      failed += 1;
    }
  }

  await updateConfig({
    lastSyncAt: new Date().toISOString(),
    lastSyncStatus: failed === 0 ? 'ok' : 'error',
  });

  return { ok, failed };
}

export async function queueAndMaybeSync(
  action: SyncAction,
  payload: Clienta | Pedido | Medida
): Promise<void> {
  await enqueueSync(action, payload);
  const config = await getConfig();
  if (config.syncAutoEnabled && config.appsScriptUrl) {
    await flushSyncQueue();
  }
}
