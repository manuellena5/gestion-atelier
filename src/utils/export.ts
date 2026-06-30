import * as XLSX from 'xlsx';
import type { Clienta, Medida, Pedido } from '../db/schema';
import { calcCostoBase, calcTotalCobrado } from './calculations';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ];
  return lines.join('\n');
}

function clientasToRows(clientas: Clienta[], medidas: Medida[]): Record<string, string | number>[] {
  return clientas.map((clienta) => {
    const medidasClienta = medidas.filter((m) => m.clientaId === clienta.id);
    const row: Record<string, string | number> = {
      id: clienta.id,
      nombre: clienta.nombre,
      telefono: clienta.telefono ?? '',
      email: clienta.email ?? '',
      notas: clienta.notas ?? '',
      fechaCreacion: clienta.fechaCreacion,
    };
    for (const medida of medidasClienta) {
      row[medida.nombre] = medida.valor;
    }
    return row;
  });
}

function pedidosToRows(pedidos: Pedido[], clientas: Clienta[]): Record<string, string | number>[] {
  return pedidos.map((pedido) => {
    const clienta = clientas.find((c) => c.id === pedido.clientaId);
    const costoBase = calcCostoBase(pedido.insumos, pedido.horasDedicadas, pedido.precioPorHora);
    return {
      id: pedido.id,
      clienta: clienta?.nombre ?? '',
      descripcion: pedido.descripcion,
      estado: pedido.estado,
      fechaPedido: pedido.fechaPedido,
      fechaEntrega: pedido.fechaEntrega ?? '',
      costoBase,
      precioVenta: pedido.precioVenta ?? '',
      totalCobrado: calcTotalCobrado(pedido.sena, pedido.cobros),
      notas: pedido.notas ?? '',
    };
  });
}

export function exportClientesCsv(clientas: Clienta[], medidas: Medida[]): void {
  const csv = toCsv(clientasToRows(clientas, medidas));
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'clientes-medidas.csv');
}

export function exportPedidosCsv(pedidos: Pedido[], clientas: Clienta[]): void {
  const csv = toCsv(pedidosToRows(pedidos, clientas));
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'pedidos.csv');
}

export function exportTodoExcel(clientas: Clienta[], medidas: Medida[], pedidos: Pedido[]): void {
  const workbook = XLSX.utils.book_new();

  const clientesSheet = XLSX.utils.json_to_sheet(
    clientas.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      notas: c.notas ?? '',
      fechaCreacion: c.fechaCreacion,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, clientesSheet, 'Clientes');

  const medidasSheet = XLSX.utils.json_to_sheet(
    medidas.map((m) => ({
      id: m.id,
      clientaId: m.clientaId,
      nombre: m.nombre,
      valor: m.valor,
      unidad: m.unidad,
      esBasica: m.esBasica,
      prenda: m.prenda ?? '',
      fecha: m.fecha,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, medidasSheet, 'Medidas');

  const pedidosSheet = XLSX.utils.json_to_sheet(pedidosToRows(pedidos, clientas));
  XLSX.utils.book_append_sheet(workbook, pedidosSheet, 'Pedidos');

  XLSX.writeFile(workbook, 'gestion-atelier.xlsx');
}
