import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { useClientas } from '../hooks/useClientas';
import { usePedidos } from '../hooks/usePedidos';
import { formatFecha } from '../utils/format';
import type { EstadoPedido } from '../db/schema';

interface ClientesProps {
  onSelect: (clientaId: string) => void;
  onNew: () => void;
}

function estadoMasReciente(estados: EstadoPedido[]): EstadoPedido | undefined {
  const prioridad: EstadoPedido[] = ['entregado', 'en_curso', 'pedido', 'cobrado'];
  for (const estado of prioridad) {
    if (estados.includes(estado)) return estado;
  }
  return undefined;
}

export function Clientes({ onSelect, onNew }: ClientesProps): JSX.Element {
  const { clientas, loading } = useClientas();
  const { pedidos } = usePedidos();
  const [query, setQuery] = useState('');

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lista = q ? clientas.filter((c) => c.nombre.toLowerCase().includes(q)) : clientas;
    return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [clientas, query]);

  return (
    <Layout title="Clientes" subtitle={`${clientas.length} clienta${clientas.length === 1 ? '' : 's'}`}>
      <SearchBar value={query} onChange={setQuery} placeholder="Buscar clienta..." />

      {loading && <p className="empty-state">Cargando...</p>}

      {!loading && filtradas.length === 0 && (
        <p className="empty-state">
          {query ? 'No se encontraron clientas.' : 'Todavía no hay clientas. Creá la primera.'}
        </p>
      )}

      <div className="card-list">
        {filtradas.map((clienta) => {
          const pedidosClienta = pedidos.filter((p) => p.clientaId === clienta.id);
          const estadosActivos = pedidosClienta.filter((p) => p.estado !== 'cobrado').map((p) => p.estado);
          const estado = estadoMasReciente(estadosActivos);
          return (
            <Card key={clienta.id} onClick={() => onSelect(clienta.id)}>
              <div className="card-row">
                <span className="card-title">{clienta.nombre}</span>
                {estado && <Badge estado={estado} />}
              </div>
              <p className="card-meta">
                Última actualización: {formatFecha(clienta.updatedAt)} · {pedidosClienta.length} pedido
                {pedidosClienta.length === 1 ? '' : 's'}
              </p>
            </Card>
          );
        })}
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={onNew}>
        + Nueva clienta
      </button>
    </Layout>
  );
}
