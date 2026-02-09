import { ConnectionStatus as ConnectionStatusType } from '../lib/types';

interface Props {
  status: ConnectionStatusType;
}

const CONFIG: Record<
  ConnectionStatusType,
  { dotColor: string; borderColor: string; textColor: string; glowClass: string; label: string; pulse: boolean }
> = {
  connected: {
    dotColor: 'bg-bid',
    borderColor: 'border-bid/30',
    textColor: 'text-bid',
    glowClass: 'glow-green',
    label: 'LIVE',
    pulse: true,
  },
  connecting: {
    dotColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-500',
    glowClass: '',
    label: 'CONNECTING',
    pulse: false,
  },
  disconnected: {
    dotColor: 'bg-ask',
    borderColor: 'border-ask/30',
    textColor: 'text-ask',
    glowClass: '',
    label: 'OFFLINE',
    pulse: false,
  },
  error: {
    dotColor: 'bg-ask',
    borderColor: 'border-ask/30',
    textColor: 'text-ask',
    glowClass: 'glow-red',
    label: 'ERROR',
    pulse: false,
  },
};

export default function ConnectionStatus({ status }: Props) {
  const { dotColor, borderColor, textColor, glowClass, label, pulse } = CONFIG[status];

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${borderColor} bg-surface/60`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75 live-dot`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
      </span>
      <span
        className={`text-[10px] font-semibold uppercase tracking-widest ${textColor} ${glowClass} font-sans`}
      >
        {label}
      </span>
    </div>
  );
}
