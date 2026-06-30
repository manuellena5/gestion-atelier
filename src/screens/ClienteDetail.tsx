import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { useClientas } from '../hooks/useClientas';
import { useMedidas } from '../hooks/useMedidas';
import { usePedidos } from '../hooks/usePedidos';
import { useLongPress } from '../hooks/useLongPress';
import { formatFecha, formatMoneda } from '../utils/format';
import { calcTotalCobrado } from '../utils/calculations';
import type { Medida } from '../db/schema';

interface ClienteDetailProps {
  clientaId: string;
  onBack: () => void;
  onEdit: () => void;
  onSelectPedido: (pedidoId: string) => void;
  onNewPedido: (clientaId: string) => void;
}

interface MedidaExtraCardProps {
  medida: Medida;
  onLongPress: (medida: Medida) => void;
}

function MedidaExtraCard({ medida, onLongPress }: MedidaExtraCardProps): JSX.Element {
  const longPressHandlers = useLongPress(() => onLongPress(medida));

  return (
    <div className="card" {...longPressHandlers}>
      <div className="card-row">
        <span className="card-title">{medida.nombre}</span>
        <span>
          {medida.valor} {medida.unidad}
        </span>
      </div>
      {medida.prenda && <p className="card-meta">Prenda: {medida.prenda}</p>}
    </div>
  );
}

export function ClienteDetail({
  clientaId,
  onBack,
  onEdit,
  onSelectPedido,
  onNewPedido,
}: ClienteDetailProps): JSX.Element {
  const { clientas } = useClientas();
  const { medidas, saveMedidaValor, addMedida, editMedida, removeMedida } = useMedidas(clientaId);
  const { pedidos } = usePedidos();

  const [showExtraModal, setShowExtraModal] = useState(false);
  const [extraNombre, setExtraNombre] = useState('');
  const [extraValor, setExtraValor] = useState('');
  const [extraUnidad, setExtraUnidad] = useState('cm');
  const [extraPrenda, setExtraPrenda] = useState('');

  const [actionsMedida, setActionsMedida] = useState<Medida | null>(null);
  const [editingMedida, setEditingMedida] = useState<Medida | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editUnidad, setEditUnidad] = useState('cm');
  const [editPrenda, setEditPrenda] = useState('');
  const [deletingMedida, setDeletingMedida] = useState<Medida | null>(null);

  const clienta = clientas.find((c) => c.id === clientaId);
  const medidasBasicas = useMemo(() => medidas.filter((m) => m.esBasica), [medidas]);
  const medidasExtra = useMemo(() => medidas.filter((m) => !m.esBasica), [medidas]);
  const pedidosClienta = useMemo(
    () => pedidos.filter((p) => p.clientaId === clientaId),
    [pedidos, clientaId]
  );

  const ultimaActualizacion = useMemo(() => {
    if (medidas.length === 0) return undefined;
    return medidas.reduce((latest, m) => (m.fecha > latest ? m.fecha : latest), medidas[0].fecha);
  }, [medidas]);

  async function handleAddExtra(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!extraNombre.trim()) return;
    await addMedida({
      clientaId,
      nombre: extraNombre.trim(),
      valor: extraValor.trim(),
      unidad: extraUnidad.trim() || 'cm',
      prenda: extraPrenda.trim() || undefined,
    });
    setExtraNombre('');
    setExtraValor('');
    setExtraUnidad('cm');
    setExtraPrenda('');
    setShowExtraModal(false);
  }

  function openActions(medida: Medida): void {
    setActionsMedida(medida);
  }

  function startEdit(medida: Medida): void {
    setEditNombre(medida.nombre);
    setEditValor(medida.valor);
    setEditUnidad(medida.unidad);
    setEditPrenda(medida.prenda ?? '');
    setEditingMedida(medida);
    setActionsMedida(null);
  }

  function startDelete(medida: Medida): void {
    setDeletingMedida(medida);
    setActionsMedida(null);
  }

  async function handleEditSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!editingMedida || !editNombre.trim()) return;
    await editMedida(editingMedida, {
      nombre: editNombre.trim(),
      valor: editValor.trim(),
      unidad: editUnidad.trim() || 'cm',
      prenda: editPrenda.trim() || undefined,
    });
    setEditingMedida(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deletingMedida) return;
    await removeMedida(deletingMedida.id);
    setDeletingMedida(null);
  }

  if (!clienta) {
    return (
      <Layout title="Clienta" onBack={onBack} backLabel="Clientes">
        <p className="empty-state">Clienta no encontrada.</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={clienta.nombre}
      onBack={onBack}
      backLabel="Clientes"
      headerExtra={
        <button type="button" className="btn btn-sm btn-outline" onClick={onEdit}>
          Editar
        </button>
      }
      subtitle={ultimaActualizacion ? `Medidas actualizadas: ${formatFecha(ultimaActualizacion)}` : undefined}
    >
      <section className="section">
        <h2 className="section-title">Medidas básicas</h2>
        <Card>
          {medidasBasicas.map((medida) => (
            <div className="field" key={medida.id}>
              <label className="field-label" htmlFor={`medida-${medida.id}`}>
                {medida.nombre} ({medida.unidad})
              </label>
              <input
                id={`medida-${medida.id}`}
                className="field-input"
                defaultValue={medida.valor}
                onBlur={(e) => {
                  if (e.target.value !== medida.valor) {
                    void saveMedidaValor(medida, e.target.value);
                  }
                }}
              />
            </div>
          ))}
        </Card>
      </section>

      <section className="section">
        <div className="card-row" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 className="section-title">Medidas extra</h2>
        </div>
        {medidasExtra.length === 0 && <p className="text-muted">Sin medidas personalizadas.</p>}
        <div className="card-list">
          {medidasExtra.map((medida) => (
            <MedidaExtraCard key={medida.id} medida={medida} onLongPress={openActions} />
          ))}
        </div>
        <p className="card-meta">Mantené presionada una medida para editarla o borrarla.</p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-md)' }}
          onClick={() => setShowExtraModal(true)}
        >
          + Agregar medida
        </button>
      </section>

      <section className="section">
        <h2 className="section-title">Pedidos</h2>
        {pedidosClienta.length === 0 && <p className="text-muted">Sin pedidos todavía.</p>}
        <div className="card-list">
          {pedidosClienta.map((pedido) => (
            <Card key={pedido.id} onClick={() => onSelectPedido(pedido.id)}>
              <div className="card-row">
                <span className="card-title">{pedido.descripcion}</span>
                <Badge estado={pedido.estado} />
              </div>
              <p className="card-meta">
                {formatMoneda(pedido.precioVenta)} · Cobrado {formatMoneda(calcTotalCobrado(pedido.sena, pedido.cobros))}
              </p>
            </Card>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 'var(--space-md)' }}
          onClick={() => onNewPedido(clientaId)}
        >
          + Nuevo pedido
        </button>
      </section>

      {showExtraModal && (
        <Modal title="Agregar medida" onClose={() => setShowExtraModal(false)}>
          <form onSubmit={handleAddExtra}>
            <div className="field">
              <label className="field-label" htmlFor="extra-nombre">
                Nombre *
              </label>
              <input
                id="extra-nombre"
                className="field-input"
                value={extraNombre}
                onChange={(e) => setExtraNombre(e.target.value)}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="extra-valor">
                  Valor
                </label>
                <input
                  id="extra-valor"
                  className="field-input"
                  value={extraValor}
                  onChange={(e) => setExtraValor(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="extra-unidad">
                  Unidad
                </label>
                <input
                  id="extra-unidad"
                  className="field-input"
                  value={extraUnidad}
                  onChange={(e) => setExtraUnidad(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="extra-prenda">
                Prenda (opcional)
              </label>
              <input
                id="extra-prenda"
                className="field-input"
                value={extraPrenda}
                onChange={(e) => setExtraPrenda(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowExtraModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Agregar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {actionsMedida && (
        <Modal title={actionsMedida.nombre} onClose={() => setActionsMedida(null)}>
          <div className="modal-actions" style={{ flexDirection: 'column' }}>
            <button type="button" className="btn btn-secondary" onClick={() => startEdit(actionsMedida)}>
              Editar
            </button>
            <button type="button" className="btn btn-danger" onClick={() => startDelete(actionsMedida)}>
              Borrar
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setActionsMedida(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {editingMedida && (
        <Modal title="Editar medida" onClose={() => setEditingMedida(null)}>
          <form onSubmit={handleEditSubmit}>
            <div className="field">
              <label className="field-label" htmlFor="edit-nombre">
                Nombre *
              </label>
              <input
                id="edit-nombre"
                className="field-input"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label" htmlFor="edit-valor">
                  Valor
                </label>
                <input
                  id="edit-valor"
                  className="field-input"
                  value={editValor}
                  onChange={(e) => setEditValor(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="edit-unidad">
                  Unidad
                </label>
                <input
                  id="edit-unidad"
                  className="field-input"
                  value={editUnidad}
                  onChange={(e) => setEditUnidad(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="edit-prenda">
                Prenda (opcional)
              </label>
              <input
                id="edit-prenda"
                className="field-input"
                value={editPrenda}
                onChange={(e) => setEditPrenda(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditingMedida(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deletingMedida && (
        <Modal title="Borrar medida" onClose={() => setDeletingMedida(null)}>
          <p>
            ¿Estás segura de que querés borrar la medida <strong>{deletingMedida.nombre}</strong>? Esta acción no
            se puede deshacer.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setDeletingMedida(null)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-danger" onClick={() => void handleConfirmDelete()}>
              Borrar
            </button>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
