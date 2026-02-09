import { useContext, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { OrderBookContext } from '../App';
import { Venue } from '../lib/types';

interface Props {
  venue: Venue;
  symbol: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { time: number; mid: number } }>;
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-elevated border border-border rounded-md px-3 py-2 shadow-panel">
      <div className="text-xs text-muted mb-1">{formatTime(data.time)}</div>
      <div className="text-sm font-mono font-semibold text-text-primary tabular-nums">
        {formatPrice(data.mid)}
      </div>
    </div>
  );
}

export default function PriceChart({ venue, symbol }: Props) {
  const { getPriceHistory } = useContext(OrderBookContext);
  const history = getPriceHistory(venue, symbol);

  const { openPrice, currentPrice, priceChange, priceChangePct, isUp } = useMemo(() => {
    if (history.length === 0) {
      return { openPrice: 0, currentPrice: 0, priceChange: 0, priceChangePct: 0, isUp: true };
    }
    const open = history[0].mid;
    const current = history[history.length - 1].mid;
    const change = current - open;
    const pct = open !== 0 ? (change / open) * 100 : 0;
    return {
      openPrice: open,
      currentPrice: current,
      priceChange: change,
      priceChangePct: pct,
      isUp: change >= 0,
    };
  }, [history]);

  const yDomain = useMemo((): [number, number] => {
    if (history.length === 0) return [0, 1];
    const prices = history.map((p) => p.mid);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || max * 0.001;
    return [min - padding, max + padding];
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="bg-panel border border-border rounded-lg panel-highlight overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-xs text-muted uppercase tracking-wider">Price Chart</div>
        </div>
        <div className="flex items-center justify-center h-[250px] text-muted text-sm">
          Waiting for price data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border rounded-lg panel-highlight overflow-hidden">
      {/* Header with current price */}
      <div className="px-4 py-3 border-b border-border flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-mono font-bold text-text-primary tabular-nums">
            {formatPrice(currentPrice)}
          </span>
          <span
            className={`text-sm font-mono tabular-nums font-medium ${
              isUp ? 'text-bid glow-green' : 'text-ask glow-red'
            }`}
          >
            {isUp ? '+' : ''}
            {formatPrice(priceChange)}
          </span>
          <span
            className={`text-xs font-mono tabular-nums ${
              isUp ? 'text-bid' : 'text-ask'
            }`}
          >
            ({isUp ? '+' : ''}
            {priceChangePct.toFixed(3)}%)
          </span>
        </div>
        <span className="text-[10px] text-muted uppercase tracking-wider">Price Chart</span>
      </div>

      {/* Chart */}
      <div className="px-2 py-2">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1c2033"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#1c2033"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(v: number) => formatPrice(v)}
              stroke="#1c2033"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#2a3050', strokeWidth: 1 }}
            />
            <ReferenceLine
              y={openPrice}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="mid"
              stroke="#3b82f6"
              strokeWidth={1.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 3,
                fill: '#3b82f6',
                stroke: '#07080d',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
