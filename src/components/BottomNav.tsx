export type NavTab = 'clientes' | 'pedidos' | 'resumen' | 'configuracion';

interface BottomNavProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const TABS: { id: NavTab; label: string; icon: string }[] = [
  { id: 'clientes', label: 'Clientes', icon: '👤' },
  { id: 'pedidos', label: 'Pedidos', icon: '🧵' },
  { id: 'resumen', label: 'Resumen', icon: '📊' },
  { id: 'configuracion', label: 'Config', icon: '⚙️' },
];

export function BottomNav({ active, onNavigate }: BottomNavProps): JSX.Element {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onNavigate(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="bottom-nav-item-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
