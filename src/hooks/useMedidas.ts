import { useCallback, useEffect, useState } from 'react';
import type { Medida } from '../db/schema';
import * as clientasDb from '../db/clientasDb';
import { queueAndMaybeSync } from '../sync/queue';

interface UseMedidasResult {
  medidas: Medida[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveMedidaValor: (medida: Medida, valor: string) => Promise<void>;
  addMedida: (data: Pick<Medida, 'clientaId' | 'nombre' | 'valor' | 'unidad' | 'prenda'>) => Promise<Medida>;
  removeMedida: (id: string) => Promise<void>;
}

export function useMedidas(clientaId: string | undefined): UseMedidasResult {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!clientaId) {
      setMedidas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await clientasDb.getMedidasByClienta(clientaId);
      setMedidas(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar medidas');
    } finally {
      setLoading(false);
    }
  }, [clientaId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveMedidaValor = useCallback(
    async (medida: Medida, valor: string) => {
      const updated: Medida = { ...medida, valor, fecha: new Date().toISOString() };
      await clientasDb.upsertMedida(updated);
      await queueAndMaybeSync('syncMedidas', updated);
      await reload();
    },
    [reload]
  );

  const addMedida = useCallback(
    async (data: Pick<Medida, 'clientaId' | 'nombre' | 'valor' | 'unidad' | 'prenda'>) => {
      const medida = await clientasDb.createMedida(data);
      await queueAndMaybeSync('syncMedidas', medida);
      await reload();
      return medida;
    },
    [reload]
  );

  const removeMedida = useCallback(
    async (id: string) => {
      await clientasDb.deleteMedida(id);
      await reload();
    },
    [reload]
  );

  return { medidas, loading, error, reload, saveMedidaValor, addMedida, removeMedida };
}
