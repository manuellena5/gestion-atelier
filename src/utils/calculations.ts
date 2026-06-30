import type { Insumo, Cobro } from '../db/schema';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcCostoInsumos(insumos: Insumo[]): number {
  const total = insumos.reduce((sum, insumo) => {
    const cantidad = insumo.cantidad ?? 0;
    const valorUnitario = insumo.valorUnitario ?? 0;
    return sum + cantidad * valorUnitario;
  }, 0);
  return round2(total);
}

export function calcCostoManoObra(horas?: number, precioHora?: number): number {
  if (!horas || !precioHora) return 0;
  return round2(horas * precioHora);
}

export function calcCostoBase(insumos: Insumo[], horas?: number, precioHora?: number): number {
  return round2(calcCostoInsumos(insumos) + calcCostoManoObra(horas, precioHora));
}

export function calcPrecioSugerido(costoBase: number, pctGanancia: number): number {
  return round2(costoBase * (1 + pctGanancia / 100));
}

export function calcPctGananciaReal(costoBase: number, precioVenta: number): number | undefined {
  if (!costoBase) return undefined;
  return round2(((precioVenta - costoBase) / costoBase) * 100);
}

export function calcTotalCobrado(sena?: number, cobros?: Cobro[]): number {
  const totalCobros = (cobros ?? []).reduce((sum, cobro) => sum + cobro.monto, 0);
  return round2((sena ?? 0) + totalCobros);
}

export function calcSaldoPendiente(
  precioVenta?: number,
  sena?: number,
  cobros?: Cobro[]
): number | undefined {
  if (precioVenta === undefined) return undefined;
  return round2(precioVenta - calcTotalCobrado(sena, cobros));
}

export function calcPctCobrado(precioVenta?: number, sena?: number, cobros?: Cobro[]): number {
  if (!precioVenta) return 0;
  const cobrado = calcTotalCobrado(sena, cobros);
  return round2((cobrado / precioVenta) * 100);
}
