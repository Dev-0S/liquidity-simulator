import { Book } from '../lib/types';
import { calcMid, calcSpreadAbs, calcSpreadBps, calcMicroprice } from '../lib/metrics';

interface Props {
  book: Book | undefined;
}

interface MetricCard {
  label: string;
  value: string;
  colorClass: string;
  glowClass: string;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

export default function SpreadMetrics({ book }: Props) {
  if (!book || book.bids.length === 0 || book.asks.length === 0) {
    return (
      <div className="flex items-stretch gap-2 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[120px] bg-panel border border-border rounded-lg px-3 py-2.5 panel-highlight"
          >
            <div className="text-[9px] text-muted uppercase tracking-wider font-sans mb-1">--</div>
            <div className="text-sm tabular-nums text-muted font-mono">--</div>
          </div>
        ))}
      </div>
    );
  }

  const bestBid = book.bids[0][0];
  const bestAsk = book.asks[0][0];
  const bidSize = book.bids[0][1];
  const askSize = book.asks[0][1];

  const mid = calcMid(bestBid, bestAsk);
  const spreadAbs = calcSpreadAbs(bestBid, bestAsk);
  const spreadBps = calcSpreadBps(bestBid, bestAsk);
  const microprice = calcMicroprice(bestBid, bestAsk, bidSize, askSize);

  const metrics: MetricCard[] = [
    { label: 'Best Bid', value: formatPrice(bestBid), colorClass: 'text-bid', glowClass: 'glow-green' },
    { label: 'Best Ask', value: formatPrice(bestAsk), colorClass: 'text-ask', glowClass: 'glow-red' },
    { label: 'Mid Price', value: formatPrice(mid), colorClass: 'text-text-primary', glowClass: '' },
    { label: 'Spread', value: formatPrice(spreadAbs), colorClass: 'text-text-primary', glowClass: '' },
    { label: 'Spread (bps)', value: spreadBps.toFixed(2), colorClass: 'text-text-primary', glowClass: '' },
    { label: 'Microprice', value: formatPrice(microprice), colorClass: 'text-text-primary', glowClass: '' },
  ];

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex-1 min-w-[120px] bg-panel border border-border rounded-lg px-3 py-2.5 panel-highlight bg-panel-gradient hover:shadow-panel-hover"
        >
          <div className="text-[9px] text-muted uppercase tracking-wider font-sans mb-1">
            {m.label}
          </div>
          <div
            className={`text-sm tabular-nums font-semibold font-mono ${m.colorClass} ${m.glowClass}`}
          >
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}
