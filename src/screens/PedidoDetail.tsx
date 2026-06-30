import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Modal } from '../components/Modal';
import { usePedidos } from '../hooks/usePedidos';
import { useClientas } from '../hooks/useClientas';
import {
  calcCostoBase,
  calcCostoInsumos,
  calcCostoManoObra,
  calcPctCobrado,
  calcPctGananciaReal,
  calcSaldoPendiente,
  calcTotalCobrado,
} from '../utils/calculations';
import { diasRestantes, formatFecha, formatMoneda } from '../utils/format';
import type { EstadoPedido } from '../db/schema';

interface PedidoDetailProps {
  pedidoId: string;
  onBack: () => void;
  onEdit: () => void;
}

const ESTADOS: { id: EstadoPedido; label: string }[] = [
  { id: 'pedido', label: 'Pedido' },
  { id: 'en_curso', label: 'En curso' },
  { id: 'entregado', label: 'Entregado' },
  { id: 'cobrado', label: 'Cobrado' },
];

export function PedidoDetail({ pedidoId, onBack, onEdit }: PedidoDetailProps): JSX.Element {
  const { pedidos, registrarCobro, cambiarEstado } = usePedidos();
  const { clientas } = useClientas();
  const [showCobroModal, setShowCobroModal] = useState(false);
  const [montoCobro, setMontoCobro] = useState('');
  const [notaCobro, setNotaCobro] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pedido = pedidos.find((p) => p.id === pedidoId);
  const clienta = clientas.find((c) => c.id === pedido?.clientaId);

  const dias = useMemo(() => diasRestantes(pedido?.fechaEntrega), [pedido?.fechaEntrega]);

  if (!pedido) {
    return (
      <Layout title="Pedido" onBack={onBack} backLabel="Pedidos">
        <p className="empty-state">Pedido no encontrado.</p>
      </Layout>
    );
  }

  const currentPedidoId = pedido.id;
  const costoInsumos = calcCostoInsumos(pedido.insumos);
  const costoManoObra = calcCostoManoObra(pedido.horasDedicadas, pedido.precioPorHora);
  const costoBase = calcCostoBase(pedido.insumos, pedido.horasDedicadas, pedido.precioPorHora);
  const pctGananciaReal =
    pedido.precioVenta !== undefined ? calcPctGananciaReal(costoBase, pedido.precioVenta) : undefined;
  const totalCobrado = calcTotalCobrado(pedido.sena, pedido.cobros);
  const saldo = calcSaldoPendiente(pedido.precioVenta, pedido.sena, pedido.cobros);
  const pct = calcPctCobrado(pedido.precioVenta, pedido.sena, pedido.cobros);

  async function handleRegistrarCobro(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const monto = Number(montoCobro);
    if (!monto || monto <= 0) {
      setError('Ingresá un monto válido.');
      return;
    }
    try {
      await registrarCobro(currentPedidoId, {
        fecha: new Date().toISOString(),
        monto,
        nota: notaCobro.trim() || undefined,
      });
      setMontoCobro('');
      setNotaCobro('');
      setError(null);
      setShowCobroModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el cobro.');
    }
  }

  return (
    <Layout
      title={pedido.descripcion}
      onBack={onBack}
      backLabel="Pedidos"
      headerExtra={<Badge estado={pedido.estado} />}
    >
      <section className="section two-col">
        <Card>
          <p className="card-meta">Fecha pedido</p>
          <p className="card-title">{formatFecha(pedido.fechaPedido)}</p>
        </Card>
        <Card>
          <p className="card-meta">Entrega</p>
          <p className="card-title">{pedido.fechaEntrega ? formatFecha(pedido.fechaEntrega) : '—'}</p>
          {dias !== undefined && (
            <p className="card-meta">{dias >= 0 ? `Faltan ${dias} días` : `Atrasado ${Math.abs(dias)} días`}</p>
          )}
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">Insumos</h2>
        {pedido.insumos.length === 0 && <p className="text-muted">Sin insumos registrados.</p>}
        {pedido.insumos.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cant.</th>
                <th>$/u</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedido.insumos.map((insumo) => (
                <tr key={insumo.id}>
                  <td>{insumo.nombre}</td>
                  <td>{insumo.cantidad ?? '—'}</td>
                  <td>{insumo.valorUnitario !== undefined ? formatMoneda(insumo.valorUnitario) : '—'}</td>
                  <td>
                    {insumo.cantidad !== undefined && insumo.valorUnitario !== undefined
                      ? formatMoneda(insumo.cantidad * insumo.valorUnitario)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Pricing</h2>
        <Card>
          <div className="card-row">
            <span className="text-muted">Costo insumos</span>
            <span>{formatMoneda(costoInsumos)}</span>
          </div>
          {pedido.horasDedicadas && pedido.precioPorHora && (
            <div className="card-row" style={{ marginTop: 'var(--space-sm)' }}>
              <span className="text-muted">
                Mano de obra: {pedido.horasDedicadas} hs × {formatMoneda(pedido.precioPorHora)}
              </span>
              <span>{formatMoneda(costoManoObra)}</span>
            </div>
          )}
          {pedido.pctGanancia !== undefined && (
            <div className="card-row" style={{ marginTop: 'var(--space-sm)' }}>
              <span className="text-muted">% Ganancia aplicada</span>
              <span>{pedido.pctGanancia}%</span>
            </div>
          )}
          <div className="card-row" style={{ marginTop: 'var(--space-md)' }}>
            <span className="card-title">Precio de venta</span>
            <span className="card-title">{formatMoneda(pedido.precioVenta)}</span>
          </div>
          {pctGananciaReal !== undefined && (
            <p className="text-muted" style={{ marginTop: 'var(--space-xs)' }}>
              % Ganancia real: {pctGananciaReal}%
            </p>
          )}
        </Card>
      </section>

      <section className="section">
        <h2 className="section-title">Cobro</h2>
        <Card>
          {pedido.sena !== undefined && (
            <div className="card-row">
              <span className="text-muted">Seña</span>
              <span>{formatMoneda(pedido.sena)}</span>
            </div>
          )}
          {pedido.cobros.map((cobro) => (
            <div className="card-row" key={cobro.id} style={{ marginTop: 'var(--space-sm)' }}>
              <span className="text-muted">
                {formatFecha(cobro.fecha)}
                {cobro.nota ? ` · ${cobro.nota}` : ''}
              </span>
              <span>{formatMoneda(cobro.monto)}</span>
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-md)' }}>
            <ProgressBar pct={pct} label={`${Math.round(pct)}% cobrado`} />
          </div>
          {saldo !== undefined && saldo > 0 && (
            <p className="text-warning" style={{ marginTop: 'var(--space-sm)' }}>
              Faltan {formatMoneda(saldo)}
            </p>
          )}
          <p className="card-meta" style={{ marginTop: 'var(--space-xs)' }}>
            Total cobrado: {formatMoneda(totalCobrado)}
          </p>
        </Card>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-md)' }}
          onClick={() => setShowCobroModal(true)}
        >
          💰 Registrar cobro
        </button>
      </section>

      <section className="section">
        <h2 className="section-title">Estado</h2>
        <div className="status-pills">
          {ESTADOS.map((estado) => (
            <button
              key={estado.id}
              type="button"
              className={`status-pill ${pedido.estado === estado.id ? 'active' : ''}`}
              onClick={() => void cambiarEstado(currentPedidoId, estado.id)}
            >
              {estado.label}
            </button>
          ))}
        </div>
      </section>

      {clienta && <p className="text-muted">Clienta: {clienta.nombre}</p>}

      <button type="button" className="btn btn-outline" style={{ marginTop: 'var(--space-lg)' }} onClick={onEdit}>
        Editar pedido
      </button>

      {showCobroModal && (
        <Modal title="Registrar cobro" onClose={() => setShowCobroModal(false)}>
          <form onSubmit={handleRegistrarCobro}>
            <div className="field">
              <label className="field-label" htmlFor="monto-cobro">
                Monto *
              </label>
              <input
                id="monto-cobro"
                type="number"
                className="field-input"
                value={montoCobro}
                onChange={(e) => setMontoCobro(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="nota-cobro">
                Nota
              </label>
              <input
                id="nota-cobro"
                className="field-input"
                value={notaCobro}
                onChange={(e) => setNotaCobro(e.target.value)}
              />
            </div>
            {error && <p className="text-warning">{error}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowCobroModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Registrar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
