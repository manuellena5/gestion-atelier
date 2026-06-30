import { nanoid } from 'nanoid';
import { getDb } from './database';
import { STORES, MEDIDAS_BASICAS, type Clienta, type Medida } from './schema';

export async function getAllClientas(): Promise<Clienta[]> {
  try {
    const db = await getDb();
    return await db.getAll(STORES.CLIENTAS);
  } catch (error) {
    throw new Error(`No se pudieron obtener las clientas: ${String(error)}`);
  }
}

export async function getClientaById(id: string): Promise<Clienta | undefined> {
  try {
    const db = await getDb();
    return await db.get(STORES.CLIENTAS, id);
  } catch (error) {
    throw new Error(`No se pudo obtener la clienta: ${String(error)}`);
  }
}

export async function createClienta(
  data: Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>
): Promise<Clienta> {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const clienta: Clienta = {
      id: nanoid(),
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      notas: data.notas,
      fechaCreacion: now,
      updatedAt: now,
    };

    const tx = db.transaction([STORES.CLIENTAS, STORES.MEDIDAS], 'readwrite');
    await tx.objectStore(STORES.CLIENTAS).add(clienta);

    const medidasStore = tx.objectStore(STORES.MEDIDAS);
    for (const nombreMedida of MEDIDAS_BASICAS) {
      const medida: Medida = {
        id: nanoid(),
        clientaId: clienta.id,
        nombre: nombreMedida,
        valor: '',
        unidad: 'cm',
        esBasica: true,
        fecha: now,
      };
      await medidasStore.add(medida);
    }

    await tx.done;
    return clienta;
  } catch (error) {
    throw new Error(`No se pudo crear la clienta: ${String(error)}`);
  }
}

export async function updateClienta(
  id: string,
  data: Partial<Pick<Clienta, 'nombre' | 'telefono' | 'email' | 'notas'>>
): Promise<Clienta> {
  try {
    const db = await getDb();
    const existing = await db.get(STORES.CLIENTAS, id);
    if (!existing) {
      throw new Error('Clienta no encontrada');
    }
    const updated: Clienta = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await db.put(STORES.CLIENTAS, updated);
    return updated;
  } catch (error) {
    throw new Error(`No se pudo actualizar la clienta: ${String(error)}`);
  }
}

export async function deleteClienta(id: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction([STORES.CLIENTAS, STORES.MEDIDAS, STORES.PEDIDOS], 'readwrite');
    await tx.objectStore(STORES.CLIENTAS).delete(id);

    const medidasIndex = tx.objectStore(STORES.MEDIDAS).index('clientaId');
    for await (const cursor of medidasIndex.iterate(id)) {
      await cursor.delete();
    }

    const pedidosIndex = tx.objectStore(STORES.PEDIDOS).index('clientaId');
    for await (const cursor of pedidosIndex.iterate(id)) {
      await cursor.delete();
    }

    await tx.done;
  } catch (error) {
    throw new Error(`No se pudo eliminar la clienta: ${String(error)}`);
  }
}

export async function getMedidasByClienta(clientaId: string): Promise<Medida[]> {
  try {
    const db = await getDb();
    return await db.getAllFromIndex(STORES.MEDIDAS, 'clientaId', clientaId);
  } catch (error) {
    throw new Error(`No se pudieron obtener las medidas: ${String(error)}`);
  }
}

export async function upsertMedida(medida: Medida): Promise<Medida> {
  try {
    const db = await getDb();
    await db.put(STORES.MEDIDAS, medida);
    return medida;
  } catch (error) {
    throw new Error(`No se pudo guardar la medida: ${String(error)}`);
  }
}

export async function createMedida(
  data: Pick<Medida, 'clientaId' | 'nombre' | 'valor' | 'unidad' | 'prenda'>
): Promise<Medida> {
  try {
    const db = await getDb();
    const medida: Medida = {
      id: nanoid(),
      clientaId: data.clientaId,
      nombre: data.nombre,
      valor: data.valor,
      unidad: data.unidad,
      esBasica: false,
      prenda: data.prenda,
      fecha: new Date().toISOString(),
    };
    await db.add(STORES.MEDIDAS, medida);
    return medida;
  } catch (error) {
    throw new Error(`No se pudo crear la medida: ${String(error)}`);
  }
}

export async function deleteMedida(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(STORES.MEDIDAS, id);
  } catch (error) {
    throw new Error(`No se pudo eliminar la medida: ${String(error)}`);
  }
}
