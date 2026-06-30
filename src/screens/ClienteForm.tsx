import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useClientas } from '../hooks/useClientas';

interface ClienteFormProps {
  clientaId?: string;
  onSaved: (clientaId: string) => void;
  onCancel: () => void;
}

export function ClienteForm({ clientaId, onSaved, onCancel }: ClienteFormProps): JSX.Element {
  const { clientas, addClienta, editClienta } = useClientas();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clientaId) return;
    const clienta = clientas.find((c) => c.id === clientaId);
    if (clienta) {
      setNombre(clienta.nombre);
      setTelefono(clienta.telefono ?? '');
      setEmail(clienta.email ?? '');
      setNotas(clienta.notas ?? '');
    }
  }, [clientaId, clientas]);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        notas: notas.trim() || undefined,
      };
      const clienta = clientaId ? await editClienta(clientaId, data) : await addClienta(data);
      onSaved(clienta.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la clienta.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title={clientaId ? 'Editar clienta' : 'Nueva clienta'} onBack={onCancel} backLabel="Volver">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="nombre">
            Nombre *
          </label>
          <input
            id="nombre"
            className="field-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            className="field-input"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
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

        {error && <p className="text-warning">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </Layout>
  );
}
