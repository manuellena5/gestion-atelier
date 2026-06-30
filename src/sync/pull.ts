import { fetchAllFromSheet } from './appsScript';
import { getDb } from '../db/database';
import { STORES, type Clienta, type Medida, type Pedido, type EstadoPedido } from '../db/schema';
import * as clientasDb from '../db/clientasDb';
import * as pedidosDb from '../db/pedidosDb';

export interface RemoteChanges {
  clientasNuevas: Clienta[];
  clientasActualizadas: Clienta[];
  medidasNuevas: Medida[];
  medidasActualizadas: Medida[];
  pedidosNuevos: Pedido[];
  pedidosActualizados: Pedido[];
}

function emptyToUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim() === '' ? undefined : value;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === undefined || value === null) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function normalizeClienta(raw: Clienta): Clienta {
  return {
    id: raw.id,
    nombre: String(raw.nombre ?? ''),
    telefono: emptyToUndefined(raw.telefono),
    email: emptyToUndefined(raw.email),
    notas: emptyToUndefined(raw.notas),
    fechaCreacion: String(raw.fechaCreacion ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

function normalizeMedida(raw: Medida): Medida {
  return {
    id: raw.id,
    clientaId: raw.clientaId,
    nombre: String(raw.nombre ?? ''),
    valor: String(raw.valor ?? ''),
    unidad: String(raw.unidad ?? 'cm'),
    esBasica: Boolean(raw.esBasica),
    prenda: emptyToUndefined(raw.prenda),
    fecha: String(raw.fecha ?? ''),
  };
}

function normalizePedido(raw: Pedido): Pedido {
  return {
    id: raw.id,
    clientaId: raw.clientaId,
    descripcion: String(raw.descripcion ?? ''),
    fechaPedido: String(raw.fechaPedido ?? ''),
    fechaEntrega: emptyToUndefined(raw.fechaEntrega),
    estado: raw.estado as EstadoPedido,
    insumos: Array.isArray(raw.insumos) ? raw.insumos : [],
    horasDedicadas: toOptionalNumber(raw.horasDedicadas),
    precioPorHora: toOptionalNumber(raw.precioPorHora),
    pctGanancia: toOptionalNumber(raw.pctGanancia),
    precioVenta: toOptionalNumber(raw.precioVenta),
    sena: toOptionalNumber(raw.sena),
    cobros: Array.isArray(raw.cobros) ? raw.cobros : [],
    notas: emptyToUndefined(raw.notas),
    fechaCreacion: String(raw.fechaCreacion ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
  };
}

export function hasChanges(changes: RemoteChanges): boolean {
  return (
    changes.clientasNuevas.length > 0 ||
    changes.clientasActualizadas.length > 0 ||
    changes.medidasNuevas.length > 0 ||
    changes.medidasActualizadas.length > 0 ||
    changes.pedidosNuevos.length > 0 ||
    changes.pedidosActualizados.length > 0
  );
}

export async function checkRemoteChanges(url: string): Promise<RemoteChanges> {
  const remote = await fetchAllFromSheet(url);
  const [localClientas, localMedidas, localPedidos] = await Promise.all([
    clientasDb.getAllClientas(),
    clientasDb.getAllMedidas(),
    pedidosDb.getAllPedidos(),
  ]);

  const localClientasById = new Map(localClientas.map((c) => [c.id, c]));
  const localMedidasById = new Map(localMedidas.map((m) => [m.id, m]));
  const localPedidosById = new Map(localPedidos.map((p) => [p.id, p]));

  const clientasNuevas: Clienta[] = [];
  const clientasActualizadas: Clienta[] = [];
  for (const raw of remote.clientas) {
    const clienta = normalizeClienta(raw);
    const local = localClientasById.get(clienta.id);
    if (!local) {
      clientasNuevas.push(clienta);
    } else if (clienta.updatedAt > local.updatedAt) {
      clientasActualizadas.push(clienta);
    }
  }

  const medidasNuevas: Medida[] = [];
  const medidasActualizadas: Medida[] = [];
  for (const raw of remote.medidas) {
    const medida = normalizeMedida(raw);
    const local = localMedidasById.get(medida.id);
    if (!local) {
      medidasNuevas.push(medida);
    } else if (medida.fecha > local.fecha) {
      medidasActualizadas.push(medida);
    }
  }

  const pedidosNuevos: Pedido[] = [];
  const pedidosActualizados: Pedido[] = [];
  for (const raw of remote.pedidos) {
    const pedido = normalizePedido(raw);
    const local = localPedidosById.get(pedido.id);
    if (!local) {
      pedidosNuevos.push(pedido);
    } else if (pedido.updatedAt > local.updatedAt) {
      pedidosActualizados.push(pedido);
    }
  }

  return {
    clientasNuevas,
    clientasActualizadas,
    medidasNuevas,
    medidasActualizadas,
    pedidosNuevos,
    pedidosActualizados,
  };
}

export async function applyRemoteChanges(changes: RemoteChanges): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORES.CLIENTAS, STORES.MEDIDAS, STORES.PEDIDOS], 'readwrite');

  const clientasStore = tx.objectStore(STORES.CLIENTAS);
  for (const clienta of [...changes.clientasNuevas, ...changes.clientasActualizadas]) {
    await clientasStore.put(clienta);
  }

  const medidasStore = tx.objectStore(STORES.MEDIDAS);
  for (const medida of [...changes.medidasNuevas, ...changes.medidasActualizadas]) {
    await medidasStore.put(medida);
  }

  const pedidosStore = tx.objectStore(STORES.PEDIDOS);
  for (const pedido of [...changes.pedidosNuevos, ...changes.pedidosActualizados]) {
    await pedidosStore.put(pedido);
  }

  await tx.done;
}
