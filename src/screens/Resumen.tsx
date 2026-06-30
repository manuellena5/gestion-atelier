import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { usePedidos } from '../hooks/usePedidos';
import { useConfig } from '../hooks/useConfig';
import { calcCostoBase, calcTotalCobrado, calcSaldoPendiente } from '../utils/calculations';
import { formatMesAnio, formatMoneda } from '../utils/format';
import type { EstadoPedido, Pedido } from '../db/schema';

const ESTADOS: EstadoPedido[] = ['pedido', 'en_curso', 'entregado', 'cobrado'];
const ESTADO_LABELS: Record<EstadoPedido, string> = {
  pedido: 'Pedido',
  en_curso: 'En curso',
  entregado: 'Entregado',
  cobrado: 'Cobrado',
};
const ESTADO_COLORS: Record<EstadoPedido, string> = {
  pedido: 'var(--color-pedido-text)',
  en_curso: 'var(--color-encurso-text)',
  entregado: 'var(--color-entregado-text)',
  cobrado: 'var(--color-cobrado-text)',
};

function isInMonth(pedido: Pedido, year: number, month: number): boolean {
  const fecha = new Date(pedido.fechaPedido);
  return fecha.getFullYear() === year && fecha.getMonth() === month;
}

export function Resumen(): JSX.Element {
  const { pedidos } = usePedidos();
  const { config, sincronizarAhora } = useConfig();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const pedidosDelMes = useMemo(
    () => pedidos.filter((p) => isInMonth(p, cursor.getFullYear(), cursor.getMonth())),
    [pedidos, cursor]
  );

  const kpis = useMemo(() => {
    const total = pedidosDelMes.length;
    const enCurso = pedidosDelMes.filter((p) => p.estado === 'en_curso').length;
    const entregados = pedidosDelMes.filter((p) => p.estado === 'entregado').length;
    const cobrados = pedidosDelMes.filter((p) => p.estado === 'cobrado').length;
    return { total, enCurso, entregados, cobrados };
  }, [pedidosDelMes]);

  const dinero = useMemo(() => {
    const cobrado = pedidosDelMes.reduce((sum, p) => sum + calcTotalCobrado(p.sena, p.cobros), 0);
    const porCobrar = pedidosDelMes.reduce((sum, p) => sum + (calcSaldoPendiente(p.precioVenta, p.sena, p.cobros) ?? 0), 0);
    const conAmbosDatos = pedidosDelMes.filter((p) => p.precioVenta !== undefined);
    const gananciaEstimada = conAmbosDatos.reduce((sum, p) => {
      const costoBase = calcCostoBase(p.insumos, p.horasDedicadas, p.precioPorHora);
      return sum + ((p.precioVenta ?? 0) - costoBase);
    }, 0);
    const conPrecio = pedidosDelMes.filter((p) => p.precioVenta !== undefined);
    const precioPromedio =
      conPrecio.length > 0 ? conPrecio.reduce((sum, p) => sum + (p.precioVenta ?? 0), 0) / conPrecio.length : 0;
    return { cobrado, porCobrar, gananciaEstimada, precioPromedio };
  }, [pedidosDelMes]);

  const ultimosMeses = useMemo(() => {
    const meses: { label: string; count: number; current: boolean }[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
      const count = pedidos.filter((p) => isInMonth(p, d.getFullYear(), d.getMonth())).length;
      meses.push({
        label: d.toLocaleDateString('es-AR', { month: 'short' }),
        count,
        current: i === 0,
      });
    }
    return meses;
  }, [pedidos, cursor]);

  const maxCount = Math.max(1, ...ultimosMeses.map((m) => m.count));

  const distribucion = useMemo(() => {
    const total = pedidosDelMes.length || 1;
    return ESTADOS.map((estado) => {
      const count = pedidosDelMes.filter((p) => p.estado === estado).length;
      return { estado, count, pct: (count / total) * 100 };
    });
  }, [pedidosDelMes]);

  async function handleSync(): Promise<void> {
    setSyncing(true);
    try {
      const result = await sincronizarAhora();
      setSyncMsg(`Sincronizado: ${result.ok} ok, ${result.failed} con error.`);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Error al sincronizar.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Layout title="Resumen">
      <div className="month-selector">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        >
          ◀
        </button>
        <span className="month-selector-label">{formatMesAnio(cursor)}</span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
        >
          ▶
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-value">{kpis.total}</p>
          <p className="kpi-label">Total</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{kpis.enCurso}</p>
          <p className="kpi-label">En curso</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{kpis.entregados}</p>
          <p className="kpi-label">Entregados</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{kpis.cobrados}</p>
          <p className="kpi-label">Cobrados</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <p className="kpi-value">{formatMoneda(dinero.cobrado)}</p>
          <p className="kpi-label">Cobrado</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{formatMoneda(dinero.porCobrar)}</p>
          <p className="kpi-label">Por cobrar</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{formatMoneda(dinero.gananciaEstimada)}</p>
          <p className="kpi-label">Ganancia estimada</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-value">{formatMoneda(dinero.precioPromedio)}</p>
          <p className="kpi-label">Precio promedio</p>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Pedidos por mes</h2>
        <div className="bar-chart">
          {ultimosMeses.map((mes, idx) => (
            <div className="bar-chart-col" key={idx}>
              <div
                className={`bar-chart-bar ${mes.current ? 'current' : ''}`}
                style={{ height: `${(mes.count / maxCount) * 100}%` }}
              />
              <span className="bar-chart-label">{mes.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Distribución por estado</h2>
        {distribucion.map((d) => (
          <div className="dist-row" key={d.estado}>
            <span className="dist-label">{ESTADO_LABELS[d.estado]}</span>
            <div className="dist-track">
              <div
                className="dist-fill"
                style={{ width: `${d.pct}%`, background: ESTADO_COLORS[d.estado] }}
              />
            </div>
            <span className="dist-value">{d.count}</span>
          </div>
        ))}
      </section>

      {config.appsScriptUrl && (
        <button type="button" className="btn btn-secondary" onClick={() => void handleSync()} disabled={syncing}>
          {syncing ? 'Sincronizando...' : 'Sincronizar con Google Sheets'}
        </button>
      )}
      {syncMsg && <p className="text-muted" style={{ marginTop: 'var(--space-sm)' }}>{syncMsg}</p>}
    </Layout>
  );
}
