import type { ReactNode } from 'react';

interface LayoutProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  headerExtra?: ReactNode;
  children: ReactNode;
}

export function Layout({ title, subtitle, backLabel, onBack, headerExtra, children }: LayoutProps): JSX.Element {
  return (
    <div className="layout">
      <header className="layout-header">
        {onBack && (
          <button type="button" className="layout-header-back" onClick={onBack}>
            ← {backLabel ?? 'Volver'}
          </button>
        )}
        <div className="card-row">
          <h1 className="layout-title">{title}</h1>
          {headerExtra}
        </div>
        {subtitle && <p className="layout-subtitle">{subtitle}</p>}
      </header>
      <main className="layout-content">{children}</main>
    </div>
  );
}
