import { useCallback, useEffect, useState } from 'react';
import type { Cobro, EstadoPedido, Pedido } from '../db/schema';
import * as pedidosDb from '../db/pedidosDb';
import { queueAndMaybeSync } from '../sync/queue';

interface UsePedidosResult {
  pedidos: Pedido[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addPedido: (data: pedidosDb.PedidoInput) => Promise<Pedido>;
  editPedido: (id: string, data: Partial<Omit<Pedido, 'id'>>) => Promise<Pedido>;
  removePedido: (id: string) => Promise<void>;
  registrarCobro: (id: string, cobro: Omit<Cobro, 'id'>) => Promise<Pedido>;
  cambiarEstado: (id: string, estado: EstadoPedido) => Promise<Pedido>;
}

export function usePedidos(): UsePedidosResult {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pedidosDb.getAllPedidos();
      setPedidos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addPedido = useCallback(
    async (data: pedidosDb.PedidoInput) => {
      const pedido = await pedidosDb.createPedido(data);
      await queueAndMaybeSync('syncPedidos', pedido);
      await reload();
      return pedido;
    },
    [reload]
  );

  const editPedido = useCallback(
    async (id: string, data: Partial<Omit<Pedido, 'id'>>) => {
      const pedido = await pedidosDb.updatePedido(id, data);
      await queueAndMaybeSync('syncPedidos', pedido);
      await reload();
      return pedido;
    },
    [reload]
  );

  const removePedido = useCallback(
    async (id: string) => {
      await pedidosDb.deletePedido(id);
      await reload();
    },
    [reload]
  );

  const registrarCobro = useCallback(
    async (id: string, cobro: Omit<Cobro, 'id'>) => {
      const pedido = await pedidosDb.addCobro(id, cobro);
      await queueAndMaybeSync('syncPedidos', pedido);
      await reload();
      return pedido;
    },
    [reload]
  );

  const cambiarEstado = useCallback(
    async (id: string, estado: EstadoPedido) => {
      const pedido = await pedidosDb.updatePedido(id, { estado });
      await queueAndMaybeSync('syncPedidos', pedido);
      await reload();
      return pedido;
    },
    [reload]
  );

  return { pedidos, loading, error, reload, addPedido, editPedido, removePedido, registrarCobro, cambiarEstado };
}
