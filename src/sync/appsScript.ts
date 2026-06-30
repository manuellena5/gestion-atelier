import type { Clienta, Medida, Pedido, SyncAction } from '../db/schema';

interface AppsScriptResponse {
  success?: boolean;
  message?: string;
  status?: string;
  timestamp?: string;
}

async function postToAppsScript(
  url: string,
  action: SyncAction | 'test',
  data?: Clienta | Pedido | Medida
): Promise<AppsScriptResponse> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data }),
    });
    if (!response.ok) {
      throw new Error(`Respuesta HTTP ${response.status}`);
    }
    return (await response.json()) as AppsScriptResponse;
  } catch (error) {
    throw new Error(`No se pudo conectar con Google Sheets: ${String(error)}`);
  }
}

export async function testConnection(url: string): Promise<boolean> {
  try {
    const result = await postToAppsScript(url, 'test');
    return result.success === true;
  } catch {
    return false;
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
