import { useCallback, useEffect, useState } from 'react';
import type { Clienta } from '../db/schema';
import * as clientasDb from '../db/clientasDb';
import { queueAndMaybeSync } from '../sync/queue';

interface UseClientasResult {
  clientas: Clienta[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addClienta: (data: Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>) => Promise<Clienta>;
  editClienta: (
    id: string,
    data: Partial<Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>>
  ) => Promise<Clienta>;
  removeClienta: (id: string) => Promise<void>;
}

export function useClientas(): UseClientasResult {
  const [clientas, setClientas] = useState<Clienta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientasDb.getAllClientas();
      setClientas(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addClienta = useCallback(
    async (data: Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>) => {
      const clienta = await clientasDb.createClienta(data);
      await queueAndMaybeSync('syncClientas', clienta);
      await reload();
      return clienta;
    },
    [reload]
  );

  const editClienta = useCallback(
    async (id: string, data: Partial<Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>>) => {
      const clienta = await clientasDb.updateClienta(id, data);
      await queueAndMaybeSync('syncClientas', clienta);
      await reload();
      return clienta;
    },
    [reload]
  );

  const removeClienta = useCallback(
    async (id: string) => {
      await clientasDb.deleteClienta(id);
      await reload();
    },
    [reload]
  );

  return { clientas, loading, error, reload, addClienta, editClienta, removeClienta };
}
