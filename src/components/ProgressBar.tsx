interface ProgressBarProps {
  pct: number;
  label?: string;
}

export function ProgressBar({ pct, label }: ProgressBarProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${clamped}%` }} />
      </div>
      {label && (
        <div className="progress-bar-label">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
