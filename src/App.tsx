import { useState } from 'react';
import { BottomNav, type NavTab } from './components/BottomNav';
import { Clientes } from './screens/Clientes';
import { ClienteDetail } from './screens/ClienteDetail';
import { ClienteForm } from './screens/ClienteForm';
import { Pedidos } from './screens/Pedidos';
import { PedidoDetail } from './screens/PedidoDetail';
import { PedidoForm } from './screens/PedidoForm';
import { Resumen } from './screens/Resumen';
import { Configuracion } from './screens/Configuracion';

type Screen =
  | { name: 'clientes' }
  | { name: 'cliente-detail'; clientaId: string }
  | { name: 'cliente-form'; clientaId?: string }
  | { name: 'pedidos' }
  | { name: 'pedido-detail'; pedidoId: string }
  | { name: 'pedido-form'; pedidoId?: string; clientaId?: string }
  | { name: 'resumen' }
  | { name: 'configuracion' };

function tabForScreen(screen: Screen): NavTab {
  switch (screen.name) {
    case 'clientes':
    case 'cliente-detail':
    case 'cliente-form':
      return 'clientes';
    case 'pedidos':
    case 'pedido-detail':
    case 'pedido-form':
      return 'pedidos';
    case 'resumen':
      return 'resumen';
    case 'configuracion':
      return 'configuracion';
  }
}

export function App(): JSX.Element {
  const [history, setHistory] = useState<Screen[]>([{ name: 'clientes' }]);
  const screen = history[history.length - 1];

  function navigate(to: Screen): void {
    setHistory((prev) => [...prev, to]);
  }

  function goBack(): void {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }

  function goToTab(tab: NavTab): void {
    setHistory([{ name: tab }]);
  }

  const isFormScreen = screen.name === 'cliente-form' || screen.name === 'pedido-form';

  let content: JSX.Element;

  switch (screen.name) {
    case 'clientes':
      content = (
        <Clientes
          onSelect={(clientaId) => navigate({ name: 'cliente-detail', clientaId })}
          onNew={() => navigate({ name: 'cliente-form' })}
        />
      );
      break;
    case 'cliente-detail':
      content = (
        <ClienteDetail
          clientaId={screen.clientaId}
          onBack={goBack}
          onEdit={() => navigate({ name: 'cliente-form', clientaId: screen.clientaId })}
          onSelectPedido={(pedidoId) => navigate({ name: 'pedido-detail', pedidoId })}
          onNewPedido={(clientaId) => navigate({ name: 'pedido-form', clientaId })}
        />
      );
      break;
    case 'cliente-form':
      content = (
        <ClienteForm
          clientaId={screen.clientaId}
          onSaved={(clientaId) => navigate({ name: 'cliente-detail', clientaId })}
          onCancel={goBack}
        />
      );
      break;
    case 'pedidos':
      content = (
        <Pedidos
          onSelect={(pedidoId) => navigate({ name: 'pedido-detail', pedidoId })}
          onNew={() => navigate({ name: 'pedido-form' })}
        />
      );
      break;
    case 'pedido-detail':
      content = (
        <PedidoDetail
          pedidoId={screen.pedidoId}
          onBack={goBack}
          onEdit={() => navigate({ name: 'pedido-form', pedidoId: screen.pedidoId })}
        />
      );
      break;
    case 'pedido-form':
      content = (
        <PedidoForm
          pedidoId={screen.pedidoId}
          clientaId={screen.clientaId}
          onSaved={(pedidoId) => navigate({ name: 'pedido-detail', pedidoId })}
          onCancel={goBack}
        />
      );
      break;
    case 'resumen':
      content = <Resumen />;
      break;
    case 'configuracion':
      content = <Configuracion />;
      break;
  }

  return (
    <div className={`app-shell ${isFormScreen ? 'app-shell-wide' : ''}`}>
      {content}
      <BottomNav active={tabForScreen(screen)} onNavigate={goToTab} wide={isFormScreen} />
    </div>
  );
}
