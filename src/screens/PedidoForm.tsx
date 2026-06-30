import { useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { Layout } from '../components/Layout';
import { useClientas } from '../hooks/useClientas';
import { usePedidos } from '../hooks/usePedidos';
import { useConfig } from '../hooks/useConfig';
import type { Insumo } from '../db/schema';
import { calcCostoBase, calcCostoInsumos, calcPctGananciaReal, calcPrecioSugerido } from '../utils/calculations';
import { formatMoneda } from '../utils/format';

interface PedidoFormProps {
  pedidoId?: string;
  clientaId?: string;
  onSaved: (pedidoId: string) => void;
  onCancel: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : '';
}

export function PedidoForm({ pedidoId, clientaId, onSaved, onCancel }: PedidoFormProps): JSX.Element {
  const { clientas } = useClientas();
  const { pedidos, addPedido, editPedido } = usePedidos();
  const { config } = useConfig();

  const pedidoExistente = useMemo(() => pedidos.find((p) => p.id === pedidoId), [pedidos, pedidoId]);

  const [selectedClienta, setSelectedClienta] = useState(clientaId ?? '');
  const [descripcion, setDescripcion] = useState('');
  const [fechaPedido, setFechaPedido] = useState(todayIso());
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [horasDedicadas, setHorasDedicadas] = useState('');
  const [precioPorHora, setPrecioPorHora] = useState('');
  const [pctGanancia, setPctGanancia] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [sena, setSena] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (pedidoExistente) {
      setSelectedClienta(pedidoExistente.clientaId);
      setDescripcion(pedidoExistente.descripcion);
      setFechaPedido(toDateInput(pedidoExistente.fechaPedido));
      setFechaEntrega(toDateInput(pedidoExistente.fechaEntrega));
      setInsumos(pedidoExistente.insumos);
      setHorasDedicadas(pedidoExistente.horasDedicadas?.toString() ?? '');
      setPrecioPorHora(pedidoExistente.precioPorHora?.toString() ?? '');
      setPctGanancia(pedidoExistente.pctGanancia?.toString() ?? '');
      setPrecioVenta(pedidoExistente.precioVenta?.toString() ?? '');
      setSena(pedidoExistente.sena?.toString() ?? '');
      setNotas(pedidoExistente.notas ?? '');
      setPrefilled(true);
    } else if (!prefilled && config.precioPorHoraDefault !== undefined) {
      setPrecioPorHora(config.precioPorHoraDefault.toString());
      setPrefilled(true);
    }
  }, [pedidoExistente, config.precioPorHoraDefault, prefilled]);

  const horasNum = horasDedicadas ? Number(horasDedicadas) : undefined;
  const precioHoraNum = precioPorHora ? Number(precioPorHora) : undefined;
  const pctGananciaNum = pctGanancia ? Number(pctGanancia) : undefined;
  const precioVentaNum = precioVenta ? Number(precioVenta) : undefined;
  const senaNum = sena ? Number(sena) : undefined;

  const costoInsumosTotal = calcCostoInsumos(insumos);
  const costoBase = calcCostoBase(insumos, horasNum, precioHoraNum);
  const precioSugerido =
    costoBase > 0 && pctGananciaNum !== undefined ? calcPrecioSugerido(costoBase, pctGananciaNum) : undefined;
  const pctGananciaReal =
    precioVentaNum !== undefined ? calcPctGananciaReal(costoBase, precioVentaNum) : undefined;

  function updateInsumo(id: string, field: keyof Insumo, value: string): void {
    setInsumos((prev) =>
      prev.map((insumo) => {
        if (insumo.id !== id) return insumo;
        if (field === 'nombre') return { ...insumo, nombre: value };
        if (field === 'cantidad') return { ...insumo, cantidad: value ? Number(value) : undefined };
        if (field === 'valorUnitario') return { ...insumo, valorUnitario: value ? Number(value) : undefined };
        return insumo;
      })
    );
  }

  function addInsumoRow(): void {
    setInsumos((prev) => [...prev, { id: nanoid(), nombre: '' }]);
  }

  function removeInsumoRow(id: string): void {
    setInsumos((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!selectedClienta) {
      setError('Seleccioná una clienta.');
      return;
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const insumosValidos = insumos.filter((i) => i.nombre.trim());
      const data = {
        clientaId: selectedClienta,
        descripcion: descripcion.trim(),
        fechaPedido: fechaPedido || todayIso(),
        fechaEntrega: fechaEntrega || undefined,
        insumos: insumosValidos,
        horasDedicadas: horasNum,
        precioPorHora: precioHoraNum,
        pctGanancia: pctGananciaNum,
        precioVenta: precioVentaNum,
        sena: senaNum,
        notas: notas.trim() || undefined,
      };
      const pedido = pedidoId ? await editPedido(pedidoId, data) : await addPedido(data);
      onSaved(pedido.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pedido.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title={pedidoId ? 'Editar pedido' : 'Nuevo pedido'} onBack={onCancel} backLabel="Volver">
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="clienta">
            Clienta *
          </label>
          <select
            id="clienta"
            className="field-select"
            value={selectedClienta}
            onChange={(e) => setSelectedClienta(e.target.value)}
            required
          >
            <option value="">Seleccionar...</option>
            {clientas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="descripcion">
            Descripción / Prenda *
          </label>
          <input
            id="descripcion"
            className="field-input"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="fecha-pedido">
              Fecha pedido
            </label>
            <input
              id="fecha-pedido"
              type="date"
              className="field-input"
              value={fechaPedido}
              onChange={(e) => setFechaPedido(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="fecha-entrega">
              Fecha límite de entrega
            </label>
            <input
              id="fecha-entrega"
              type="date"
              className="field-input"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
          </div>
        </div>

        <div className="field field-full">
          <span className="field-label">Insumos</span>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cant.</th>
                <th>$/u</th>
                <th>Total</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo) => {
                const total =
                  insumo.cantidad !== undefined && insumo.valorUnitario !== undefined
                    ? insumo.cantidad * insumo.valorUnitario
                    : undefined;
                return (
                  <tr key={insumo.id}>
                    <td>
                      <input
                        aria-label="Nombre del insumo"
                        value={insumo.nombre}
                        onChange={(e) => updateInsumo(insumo.id, 'nombre', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Cantidad"
                        type="number"
                        value={insumo.cantidad ?? ''}
                        onChange={(e) => updateInsumo(insumo.id, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        aria-label="Valor por unidad"
                        type="number"
                        value={insumo.valorUnitario ?? ''}
                        onChange={(e) => updateInsumo(insumo.id, 'valorUnitario', e.target.value)}
                      />
                    </td>
                    <td>{total !== undefined ? formatMoneda(total) : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        aria-label="Eliminar insumo"
                        onClick={() => removeInsumoRow(insumo.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-sm)' }} onClick={addInsumoRow}>
            + Agregar insumo
          </button>
          <p className="card-meta">Total insumos: {formatMoneda(costoInsumosTotal)}</p>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label" htmlFor="horas">
              Horas dedicadas
            </label>
            <input
              id="horas"
              type="number"
              className="field-input"
              value={horasDedicadas}
              onChange={(e) => setHorasDedicadas(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="precio-hora">
              Precio por hora
            </label>
            <input
              id="precio-hora"
              type="number"
              className="field-input"
              value={precioPorHora}
              onChange={(e) => setPrecioPorHora(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pct-ganancia">
            % Ganancia
          </label>
          <input
            id="pct-ganancia"
            type="number"
            min="0"
            max="100"
            className="field-input"
            value={pctGanancia}
            onChange={(e) => setPctGanancia(e.target.value)}
          />
        </div>

        {precioSugerido !== undefined && (
          <div className="card field-full" style={{ marginBottom: 'var(--space-lg)' }}>
            <p className="card-title">💡 Precio sugerido: {formatMoneda(precioSugerido)}</p>
            <p className="card-meta">
              Costo base {formatMoneda(costoBase)} + {pctGananciaNum}% de ganancia
            </p>
          </div>
        )}

        <div className="field">
          <label className="field-label" htmlFor="precio-venta">
            Precio de venta
          </label>
          <input
            id="precio-venta"
            type="number"
            className="field-input"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
          />
        </div>

        {pctGananciaReal !== undefined && (
          <p className="text-muted field-full">% Ganancia real: {pctGananciaReal}%</p>
        )}

        <div className="field">
          <label className="field-label" htmlFor="sena">
            Seña
          </label>
          <input
            id="sena"
            type="number"
            className="field-input"
            value={sena}
            onChange={(e) => setSena(e.target.value)}
          />
        </div>

        <div className="field field-full">
          <label className="field-label" htmlFor="notas">
            Notas
          </label>
          <textarea
            id="notas"
            className="field-textarea"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>

        {error && <p className="text-warning field-full">{error}</p>}

        <button type="submit" className="btn btn-primary field-full" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Layout>
  );
}
