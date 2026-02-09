import { useEffect, useState } from 'react';

interface Props {
  lastTs: number | undefined;
}

export default function LatencyBadge({ lastTs }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  if (!lastTs) {
    return (
      <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full bg-panel border border-border text-muted">
        --
      </span>
    );
  }

  const deltaMs = now - lastTs;

  let colorClass = 'text-bid';
  let glowClass = 'shadow-glow-green';
  let bgClass = 'bg-panel';
  let borderClass = 'border-bid/20';
  let label = `${deltaMs}ms`;

  if (deltaMs > 3000) {
    colorClass = 'text-ask';
    glowClass = 'shadow-glow-red';
    bgClass = 'bg-ask/10';
    borderClass = 'border-ask/30';
    label = 'STALE';
  } else if (deltaMs > 500) {
    colorClass = 'text-yellow-500';
    glowClass = '';
    borderClass = 'border-yellow-500/20';
    label = `${deltaMs}ms`;
  }

  return (
    <span
      className={`text-[10px] font-mono font-medium tabular-nums px-2 py-0.5 rounded-full border ${bgClass} ${borderClass} ${colorClass} ${glowClass}`}
    >
      {label}
    </span>
  );
}
