import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { usePedidos } from '../hooks/usePedidos';
import { useClientas } from '../hooks/useClientas';
import { calcPctCobrado, calcSaldoPendiente } from '../utils/calculations';
import { formatFecha, formatMoneda } from '../utils/format';
import type { EstadoPedido } from '../db/schema';

interface PedidosProps {
  onSelect: (pedidoId: string) => void;
  onNew: () => void;
}

const FILTROS: { id: EstadoPedido | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pedido', label: 'Pedido' },
  { id: 'en_curso', label: 'En curso' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cobrado', label: 'Cobrado' },
];

export function Pedidos({ onSelect, onNew }: PedidosProps): JSX.Element {
  const { pedidos, loading } = usePedidos();
  const { clientas } = useClientas();
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<EstadoPedido | 'todos'>('todos');

  const activos = useMemo(() => pedidos.filter((p) => p.estado !== 'cobrado').length, [pedidos]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pedidos
      .filter((p) => filtro === 'todos' || p.estado === filtro)
      .filter((p) => {
        if (!q) return true;
        const clienta = clientas.find((c) => c.id === p.clientaId);
        return p.descripcion.toLowerCase().includes(q) || clienta?.nombre.toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [pedidos, clientas, query, filtro]);

  return (
    <Layout title="Pedidos" subtitle={`${activos} activo${activos === 1 ? '' : 's'}`}>
      <SearchBar value={query} onChange={setQuery} placeholder="Buscar pedido..." />

      <div className="chip-row">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip ${filtro === f.id ? 'active' : ''}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="empty-state">Cargando...</p>}
      {!loading && filtrados.length === 0 && <p className="empty-state">No hay pedidos para mostrar.</p>}

      <div className="card-list">
        {filtrados.map((pedido) => {
          const clienta = clientas.find((c) => c.id === pedido.clientaId);
          const pct = calcPctCobrado(pedido.precioVenta, pedido.sena, pedido.cobros);
          const saldo = calcSaldoPendiente(pedido.precioVenta, pedido.sena, pedido.cobros);
          const alerta = pedido.estado === 'entregado' && (saldo ?? 0) > 0;
          return (
            <Card key={pedido.id} onClick={() => onSelect(pedido.id)} alert={alerta}>
              <div className="card-row">
                <span className="card-title">{pedido.descripcion}</span>
                <Badge estado={pedido.estado} />
              </div>
              <p className="card-meta">
                {clienta?.nombre ?? 'Clienta desconocida'}
                {pedido.fechaEntrega && <> · ⏰ {formatFecha(pedido.fechaEntrega)}</>}
              </p>
              <p className="card-meta">{formatMoneda(pedido.precioVenta)}</p>
              <ProgressBar pct={pct} label={`${Math.round(pct)}% cobrado${saldo && saldo > 0 ? ` · Faltan ${formatMoneda(saldo)}` : ''}`} />
            </Card>
          );
        })}
      </div>

      <button type="button" className="fab" aria-label="Nuevo pedido" onClick={onNew}>
        +
      </button>
    </Layout>
  );
}
