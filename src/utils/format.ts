import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatMoneda(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFecha(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: es });
  } catch {
    return '';
  }
}

export function formatFechaHora(iso?: string): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch {
    return '';
  }
}

export function formatMesAnio(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es });
}

export function diasRestantes(fechaEntrega?: string): number | undefined {
  if (!fechaEntrega) return undefined;
  try {
    const entrega = parseISO(fechaEntrega);
    const hoy = new Date();
    entrega.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);
    const diffMs = entrega.getTime() - hoy.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return undefined;
  }
}
