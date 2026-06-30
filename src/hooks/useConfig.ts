import { useCallback, useEffect, useState } from 'react';
import type { AppConfig } from '../db/schema';
import * as configDb from '../db/configDb';
import { testConnection } from '../sync/appsScript';
import { flushSyncQueue } from '../sync/queue';

interface UseConfigResult {
  config: AppConfig;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (data: Partial<AppConfig>) => Promise<AppConfig>;
  verificarConexion: (url: string) => Promise<boolean>;
  sincronizarAhora: () => Promise<{ ok: number; failed: number }>;
}

export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<AppConfig>({ lastSyncStatus: 'never' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configDb.getConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = useCallback(
    async (data: Partial<AppConfig>) => {
      const updated = await configDb.updateConfig(data);
      setConfig(updated);
      return updated;
    },
    []
  );

  const verificarConexion = useCallback(async (url: string) => {
    return await testConnection(url);
  }, []);

  const sincronizarAhora = useCallback(async () => {
    const result = await flushSyncQueue();
    await reload();
    return result;
  }, [reload]);

  return { config, loading, error, reload, save, verificarConexion, sincronizarAhora };
}
