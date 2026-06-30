import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useConfig } from '../hooks/useConfig';
import { useClientas } from '../hooks/useClientas';
import { usePedidos } from '../hooks/usePedidos';
import { exportClientesCsv, exportPedidosCsv, exportTodoExcel } from '../utils/export';
import { clearAllData } from '../db/database';
import { formatFechaHora } from '../utils/format';
import * as clientasDb from '../db/clientasDb';
import type { Medida } from '../db/schema';
import { APP_VERSION, forceUpdateApp } from '../utils/version';

export function Configuracion(): JSX.Element {
  const { config, save, verificarConexion, sincronizarAhora } = useConfig();
  const { clientas } = useClientas();
  const { pedidos } = usePedidos();

  const [nombreAtelier, setNombreAtelier] = useState('');
  const [precioPorHoraDefault, setPrecioPorHoraDefault] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [syncAutoEnabled, setSyncAutoEnabled] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [conexionOk, setConexionOk] = useState<boolean | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [confirmacionBorrar, setConfirmacionBorrar] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    setNombreAtelier(config.nombreAtelier ?? '');
    setPrecioPorHoraDefault(config.precioPorHoraDefault?.toString() ?? '');
    setAppsScriptUrl(config.appsScriptUrl ?? '');
    setSyncAutoEnabled(config.syncAutoEnabled ?? false);
  }, [config]);

  async function handleGuardarGeneral(): Promise<void> {
    await save({
      nombreAtelier: nombreAtelier.trim() || undefined,
      precioPorHoraDefault: precioPorHoraDefault ? Number(precioPorHoraDefault) : undefined,
    });
    setSavedMsg('Guardado.');
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function handleGuardarSync(): Promise<void> {
    await save({
      appsScriptUrl: appsScriptUrl.trim() || undefined,
      syncAutoEnabled,
    });
    setSavedMsg('Configuración de sync guardada.');
    setTimeout(() => setSavedMsg(null), 2000);
  }

  async function handleVerificar(): Promise<void> {
    if (!appsScriptUrl.trim()) return;
    setVerificando(true);
    setConexionOk(null);
    try {
      const ok = await verificarConexion(appsScriptUrl.trim());
      setConexionOk(ok);
    } catch {
      setConexionOk(false);
    } finally {
      setVerificando(false);
    }
  }

  async function handleSincronizarAhora(): Promise<void> {
    setSincronizando(true);
    try {
      const result = await sincronizarAhora();
      setSyncMsg(`Sincronizado: ${result.ok} ok, ${result.failed} con error.`);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Error al sincronizar.');
    } finally {
      setSincronizando(false);
    }
  }

  async function getAllMedidas(): Promise<Medida[]> {
    const todas: Medida[] = [];
    for (const clienta of clientas) {
      const medidas = await clientasDb.getMedidasByClienta(clienta.id);
      todas.push(...medidas);
    }
    return todas;
  }

  async function handleExportClientesCsv(): Promise<void> {
    const medidas = await getAllMedidas();
    exportClientesCsv(clientas, medidas);
  }

  async function handleExportPedidosCsv(): Promise<void> {
    exportPedidosCsv(pedidos, clientas);
  }

  async function handleExportExcel(): Promise<void> {
    const medidas = await getAllMedidas();
    exportTodoExcel(clientas, medidas, pedidos);
  }

  async function handleBorrarTodo(): Promise<void> {
    if (confirmacionBorrar !== 'BORRAR') return;
    await clearAllData();
    setConfirmacionBorrar('');
    window.location.reload();
  }

  async function handleForzarActualizacion(): Promise<void> {
    setActualizando(true);
    await forceUpdateApp();
  }

  return (
    <Layout title="Configuración">
      <section className="section">
        <h2 className="section-title">General</h2>
        <div className="field">
          <label className="field-label" htmlFor="nombre-atelier">
            Nombre del atelier
          </label>
          <input
            id="nombre-atelier"
            className="field-input"
            value={nombreAtelier}
            onChange={(e) => setNombreAtelier(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="precio-hora-default">
            Precio por hora por defecto
          </label>
          <input
            id="precio-hora-default"
            type="number"
            className="field-input"
            value={precioPorHoraDefault}
            onChange={(e) => setPrecioPorHoraDefault(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => void handleGuardarGeneral()}>
          Guardar
        </button>
        {savedMsg && <p className="text-muted">{savedMsg}</p>}
      </section>

      <hr className="divider" />

      <section className="section">
        <h2 className="section-title">Google Sheets Sync</h2>
        <div className="field">
          <label className="field-label" htmlFor="apps-script-url">
            URL del Apps Script
          </label>
          <input
            id="apps-script-url"
            className="field-input"
            value={appsScriptUrl}
            onChange={(e) => setAppsScriptUrl(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginBottom: 'var(--space-md)' }}
          onClick={() => void handleVerificar()}
          disabled={verificando || !appsScriptUrl.trim()}
        >
          {verificando ? 'Verificando...' : 'Verificar conexión'}
        </button>
        {conexionOk !== null && (
          <p className={conexionOk ? 'text-muted' : 'text-warning'}>{conexionOk ? '✓ Conexión OK' : '✗ No se pudo conectar'}</p>
        )}

        <div className="field card-row">
          <label className="field-label" htmlFor="sync-auto">
            Sincronizar automáticamente al guardar
          </label>
          <input
            id="sync-auto"
            type="checkbox"
            checked={syncAutoEnabled}
            onChange={(e) => setSyncAutoEnabled(e.target.checked)}
          />
        </div>

        <button type="button" className="btn btn-primary" style={{ marginBottom: 'var(--space-md)' }} onClick={() => void handleGuardarSync()}>
          Guardar
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleSincronizarAhora()}
          disabled={sincronizando || !config.appsScriptUrl}
        >
          {sincronizando ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
        {syncMsg && <p className="text-muted">{syncMsg}</p>}

        <p className="card-meta">
          Último sync:{' '}
          {config.lastSyncAt
            ? `${formatFechaHora(config.lastSyncAt)} — ${config.lastSyncStatus === 'ok' ? 'OK' : 'Error'}`
            : 'Nunca'}
        </p>
      </section>

      <hr className="divider" />

      <section className="section">
        <h2 className="section-title">Exportar datos</h2>
        <button type="button" className="btn btn-outline" style={{ marginBottom: 'var(--space-sm)' }} onClick={() => void handleExportClientesCsv()}>
          📄 Exportar Clientes y Medidas (CSV)
        </button>
        <button type="button" className="btn btn-outline" style={{ marginBottom: 'var(--space-sm)' }} onClick={() => void handleExportPedidosCsv()}>
          📄 Exportar Pedidos (CSV)
        </button>
        <button type="button" className="btn btn-outline" onClick={() => void handleExportExcel()}>
          📊 Exportar Todo (Excel .xlsx)
        </button>
      </section>

      <hr className="divider" />

      <section className="section">
        <h2 className="section-title">Zona de peligro</h2>
        <div className="field">
          <label className="field-label" htmlFor="confirmar-borrar">
            Escribí BORRAR para confirmar
          </label>
          <input
            id="confirmar-borrar"
            className="field-input"
            value={confirmacionBorrar}
            onChange={(e) => setConfirmacionBorrar(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => void handleBorrarTodo()}
          disabled={confirmacionBorrar !== 'BORRAR'}
        >
          🗑️ Borrar todos los datos
        </button>
      </section>

      <hr className="divider" />

      <section className="section">
        <h2 className="section-title">Acerca de</h2>
        <p className="card-meta">Versión {APP_VERSION}</p>
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 'var(--space-sm)' }}
          onClick={() => void handleForzarActualizacion()}
          disabled={actualizando}
        >
          {actualizando ? 'Actualizando...' : '🔄 Buscar actualizaciones'}
        </button>
        <p className="card-meta">Si no ves los últimos cambios, tocá este botón para forzar la actualización.</p>
      </section>
    </Layout>
  );
}
