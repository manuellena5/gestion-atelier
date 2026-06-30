import { nanoid } from 'nanoid';
import { getDb } from './database';
import { STORES, type Pedido, type Cobro } from './schema';

export async function getAllPedidos(): Promise<Pedido[]> {
  try {
    const db = await getDb();
    return await db.getAll(STORES.PEDIDOS);
  } catch (error) {
    throw new Error(`No se pudieron obtener los pedidos: ${String(error)}`);
  }
}

export async function getPedidoById(id: string): Promise<Pedido | undefined> {
  try {
    const db = await getDb();
    return await db.get(STORES.PEDIDOS, id);
  } catch (error) {
    throw new Error(`No se pudo obtener el pedido: ${String(error)}`);
  }
}

export async function getPedidosByClienta(clientaId: string): Promise<Pedido[]> {
  try {
    const db = await getDb();
    return await db.getAllFromIndex(STORES.PEDIDOS, 'clientaId', clientaId);
  } catch (error) {
    throw new Error(`No se pudieron obtener los pedidos de la clienta: ${String(error)}`);
  }
}

export type PedidoInput = Omit<Pedido, 'id' | 'fechaCreacion' | 'updatedAt' | 'cobros' | 'estado'> & {
  estado?: Pedido['estado'];
  cobros?: Cobro[];
};

export async function createPedido(data: PedidoInput): Promise<Pedido> {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const pedido: Pedido = {
      ...data,
      id: nanoid(),
      estado: data.estado ?? 'pedido',
      cobros: data.cobros ?? [],
      fechaCreacion: now,
      updatedAt: now,
    };
    await db.add(STORES.PEDIDOS, pedido);
    return pedido;
  } catch (error) {
    throw new Error(`No se pudo crear el pedido: ${String(error)}`);
  }
}

export async function updatePedido(id: string, data: Partial<Omit<Pedido, 'id'>>): Promise<Pedido> {
  try {
    const db = await getDb();
    const existing = await db.get(STORES.PEDIDOS, id);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }
    const updated: Pedido = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORES.PEDIDOS, updated);
    return updated;
  } catch (error) {
    throw new Error(`No se pudo actualizar el pedido: ${String(error)}`);
  }
}

export async function deletePedido(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORES.PEDIDOS, id);
  } catch (error) {
    throw new Error(`No se pudo eliminar el pedido: ${String(error)}`);
  }
}

export async function addCobro(pedidoId: string, cobro: Omit<Cobro, 'id'>): Promise<Pedido> {
  try {
    const db = await getDb();
    const existing = await db.get(STORES.PEDIDOS, pedidoId);
    if (!existing) {
      throw new Error('Pedido no encontrado');
    }
    const nuevoCobro: Cobro = { ...cobro, id: nanoid() };
    const updated: Pedido = {
      ...existing,
      cobros: [...existing.cobros, nuevoCobro],
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORES.PEDIDOS, updated);
    return updated;
  } catch (error) {
    throw new Error(`No se pudo registrar el cobro: ${String(error)}`);
  }
}
