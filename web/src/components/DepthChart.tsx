import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Book } from '../lib/types';
import { calcMid } from '../lib/metrics';

interface Props {
  book: Book | undefined;
}

interface DepthPoint {
  price: number;
  bidCum: number | null;
  askCum: number | null;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatSize(size: number): string {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(2)}M`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(2)}K`;
  return size.toFixed(2);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-elevated border border-border-bright rounded-md px-3 py-2 shadow-glow-blue text-xs font-mono">
      <div className="text-text-secondary mb-1">
        Price: <span className="text-text-primary">{formatPrice(label as number)}</span>
      </div>
      {payload.map((entry: any) => {
        if (entry.value == null) return null;
        const isBid = entry.dataKey === 'bidCum';
        return (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-secondary">{isBid ? 'Bid Depth' : 'Ask Depth'}:</span>
            <span className={isBid ? 'text-bid' : 'text-ask'}>{formatSize(entry.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function DepthChart({ book }: Props) {
  const { data, mid, domain } = useMemo(() => {
    if (!book || book.bids.length === 0 || book.asks.length === 0) {
      return { data: [] as DepthPoint[], mid: 0, domain: [0, 1] as [number, number] };
    }

    const midPrice = calcMid(book.bids[0][0], book.asks[0][0]);

    // Build bid cumulative: sorted from lowest price to highest (left to right)
    const sortedBids = [...book.bids].sort((a, b) => a[0] - b[0]);
    let bidCum = 0;
    // Accumulate from highest to lowest for bids (reverse cumulative)
    const bidCumulatives = new Map<number, number>();
    for (let i = book.bids.length - 1; i >= 0; i--) {
      bidCum += book.bids[i][1];
    }
    // Now walk from lowest bid upward
    let runningBidCum = bidCum;
    for (const [price, size] of sortedBids) {
      bidCumulatives.set(price, runningBidCum);
      runningBidCum -= size;
    }

    // Build ask cumulative: sorted from lowest to highest
    const sortedAsks = [...book.asks].sort((a, b) => a[0] - b[0]);
    let askCum = 0;
    const askPoints: DepthPoint[] = sortedAsks.map(([price, size]) => {
      askCum += size;
      return { price, bidCum: null, askCum };
    });

    // Build bid points
    const bidPoints: DepthPoint[] = sortedBids.map(([price]) => ({
      price,
      bidCum: bidCumulatives.get(price) ?? 0,
      askCum: null,
    }));

    // Combine and sort by price
    const combined = [...bidPoints, ...askPoints].sort((a, b) => a.price - b.price);

    // Calculate price domain
    const allPrices = combined.map((p) => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    return {
      data: combined,
      mid: midPrice,
      domain: [minPrice, maxPrice] as [number, number],
    };
  }, [book]);

  if (!book || data.length === 0) {
    return (
      <div className="bg-panel shadow-panel rounded-lg border border-border flex items-center justify-center text-muted text-xs h-full min-h-[280px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse-slow" />
          <span>Waiting for order book data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel shadow-panel rounded-lg border border-border p-3">
      <div className="font-sans text-[10px] uppercase tracking-wider text-muted mb-2 px-1">
        Depth
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1c2033"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="price"
            type="number"
            domain={domain}
            tickFormatter={formatPrice}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            stroke="#1c2033"
            tickLine={{ stroke: '#1c2033' }}
            axisLine={{ stroke: '#1c2033' }}
          />
          <YAxis
            tickFormatter={formatSize}
            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            stroke="#1c2033"
            tickLine={{ stroke: '#1c2033' }}
            axisLine={{ stroke: '#1c2033' }}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <ReferenceLine
            x={mid}
            stroke="#3b82f6"
            strokeDasharray="4 3"
            strokeWidth={1}
            strokeOpacity={0.5}
          />
          <Area
            type="stepAfter"
            dataKey="bidCum"
            stroke="#22c55e"
            fill="url(#bidGradient)"
            strokeWidth={1.5}
            connectNulls={false}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="stepAfter"
            dataKey="askCum"
            stroke="#ef4444"
            fill="url(#askGradient)"
            strokeWidth={1.5}
            connectNulls={false}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
