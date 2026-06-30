import type { EstadoPedido } from '../db/schema';

const LABELS: Record<EstadoPedido, string> = {
  pedido: 'Pedido',
  en_curso: 'En curso',
  entregado: 'Entregado',
  cobrado: 'Cobrado',
};

interface BadgeProps {
  estado: EstadoPedido;
}

export function Badge({ estado }: BadgeProps): JSX.Element {
  return <span className={`badge badge-${estado}`}>{LABELS[estado]}</span>;
}
