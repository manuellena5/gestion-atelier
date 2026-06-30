import { getDb } from './database';
import { STORES, type AppConfig } from './schema';

const CONFIG_KEY = 'singleton';

export async function getConfig(): Promise<AppConfig> {
  try {
    const db = await getDb();
    const config = await db.get(STORES.CONFIG, CONFIG_KEY);
    return config ?? { lastSyncStatus: 'never' };
  } catch {
    return { lastSyncStatus: 'never' };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORES.CONFIG, config, CONFIG_KEY);
  } catch (error) {
    throw new Error(`No se pudo guardar la configuración: ${String(error)}`);
  }
}

export async function updateConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await getConfig();
  const next: AppConfig = { ...current, ...partial };
  await saveConfig(next);
  return next;
}
