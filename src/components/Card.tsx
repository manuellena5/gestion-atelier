import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  alert?: boolean;
}

export function Card({ children, onClick, alert }: CardProps): JSX.Element {
  const className = `card ${alert ? 'card-alert' : ''}`;

  if (onClick) {
    return (
      <button type="button" className={`${className} card-tap`} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}
