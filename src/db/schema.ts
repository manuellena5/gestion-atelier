export interface Clienta {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  notas?: string;
  fechaCreacion: string;
  updatedAt: string;
}

export interface Medida {
  id: string;
  clientaId: string;
  nombre: string;
  valor: string;
  unidad: string;
  esBasica: boolean;
  prenda?: string;
  fecha: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  cantidad?: number;
  valorUnitario?: number;
}

export interface Cobro {
  id: string;
  fecha: string;
  monto: number;
  nota?: string;
}

export type EstadoPedido = 'pedido' | 'en_curso' | 'entregado' | 'cobrado';

export interface Pedido {
  id: string;
  clientaId: string;
  descripcion: string;
  fechaPedido: string;
  fechaEntrega?: string;
  estado: EstadoPedido;
  insumos: Insumo[];
  horasDedicadas?: number;
  precioPorHora?: number;
  pctGanancia?: number;
  precioVenta?: number;
  sena?: number;
  cobros: Cobro[];
  notas?: string;
  fechaCreacion: string;
  updatedAt: string;
}

export interface AppConfig {
  appsScriptUrl?: string;
  precioPorHoraDefault?: number;
  nombreAtelier?: string;
  syncAutoEnabled?: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: 'ok' | 'error' | 'never';
}

export const STORES = {
  CLIENTAS: 'clientas',
  MEDIDAS: 'medidas',
  PEDIDOS: 'pedidos',
  CONFIG: 'config',
  SYNC_QUEUE: 'syncQueue',
} as const;

export const MEDIDAS_BASICAS = [
  'Contorno cuello',
  'Contorno busto',
  'Contorno cintura',
  'Contorno 1° cadera',
  'Contorno 2° cadera',
  'Altura cadera',
  'Ancho de hombros',
  'Ancho de espalda',
  'Largo de espalda',
  'Altura de busto',
  'Separación de busto',
  'Seno superior',
  'Seno inferior',
  'Taza corpiño',
  'Largo de manga',
  'Contorno de puño',
  'Largo de falda',
] as const;

export type SyncAction = 'syncClientas' | 'syncPedidos' | 'syncMedidas';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  payload: Clienta | Pedido | Medida;
  createdAt: string;
}
