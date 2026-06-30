import type { Clienta, Medida, Pedido, SyncAction } from '../db/schema';

interface AppsScriptResponse {
  success?: boolean;
  message?: string;
  status?: string;
  timestamp?: string;
  clientas?: unknown[];
  medidas?: unknown[];
  pedidos?: unknown[];
}

export interface RemoteData {
  clientas: Clienta[];
  medidas: Medida[];
  pedidos: Pedido[];
}

type AppsScriptAction = SyncAction | 'test' | 'fetchAll';

async function postToAppsScript(
  url: string,
  action: AppsScriptAction,
  data?: Clienta | Pedido | Medida
): Promise<AppsScriptResponse> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
    });
  } catch (error) {
    throw new Error(
      `No se pudo conectar a la URL (revisá tu conexión y que la URL esté bien copiada): ${String(error)}`
    );
  }

  if (!response.ok) {
    throw new Error(`El servidor respondió con error HTTP ${response.status}.`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as AppsScriptResponse;
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, ' ').trim();
    throw new Error(
      `La respuesta no fue JSON válido (¿la implementación quedó con acceso "Cualquier persona" y fue autorizada al menos una vez?). Respuesta recibida: "${preview}"`
    );
  }
}

export async function testConnection(url: string): Promise<void> {
  const result = await postToAppsScript(url, 'test');
  if (!result.success) {
    throw new Error(result.message ?? 'El script respondió sin éxito.');
  }
}

export async function syncClienta(url: string, clienta: Clienta): Promise<void> {
  const result = await postToAppsScript(url, 'syncClientas', clienta);
  if (!result.success) {
    throw new Error(result.message ?? 'Error al sincronizar clienta');
  }
}

export async function syncPedido(url: string, pedido: Pedido): Promise<void> {
  const result = await postToAppsScript(url, 'syncPedidos', pedido);
  if (!result.success) {
    throw new Error(result.message ?? 'Error al sincronizar pedido');
  }
}

export async function syncMedida(url: string, medida: Medida): Promise<void> {
  const result = await postToAppsScript(url, 'syncMedidas', medida);
  if (!result.success) {
    throw new Error(result.message ?? 'Error al sincronizar medida');
  }
}

export async function fetchAllFromSheet(url: string): Promise<RemoteData> {
  const result = await postToAppsScript(url, 'fetchAll');
  if (!result.success) {
    throw new Error(
      result.message ??
        'No se pudieron obtener los datos de Google Sheets. Verificá que el script tenga la acción "fetchAll" (puede que necesites volver a desplegarlo).'
    );
  }
  return {
    clientas: (result.clientas ?? []) as Clienta[],
    medidas: (result.medidas ?? []) as Medida[],
    pedidos: (result.pedidos ?? []) as Pedido[],
  };
}
