import { useState, useContext, lazy, Suspense } from 'react';
import PairSelector from '../components/PairSelector';
import SpreadMetrics from '../components/SpreadMetrics';
import L2Table from '../components/L2Table';
import DepthChart from '../components/DepthChart';
import LatencyBadge from '../components/LatencyBadge';
import { OrderBookContext } from '../App';
import { Venue } from '../lib/types';

// PriceChart may or may not exist yet; lazy-load with fallback
const PriceChart = lazy(() =>
  import('../components/PriceChart').catch(() => ({
    default: () => (
      <div className="bg-panel shadow-panel rounded-lg border border-border flex items-center justify-center text-muted text-xs h-full min-h-[280px]">
        Price chart unavailable
      </div>
    ),
  }))
);

export default function Orderbook() {
  const { getBook } = useContext(OrderBookContext);
  const [venue, setVenue] = useState<Venue>('binance');
  const [symbol, setSymbol] = useState('SOLUSDT');

  const book = getBook(venue, symbol);

  return (
    <div className="space-y-3">
      {/* Top bar: pair selector + latency */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PairSelector
          selectedVenue={venue}
          selectedSymbol={symbol}
          onSelect={(v, s) => {
            setVenue(v);
            setSymbol(s);
          }}
        />
        <LatencyBadge lastTs={book?.ts} />
      </div>

      {/* Spread metrics strip */}
      <SpreadMetrics book={book} />

      {/* Main trading terminal layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3">
        {/* Left column: charts */}
        <div className="space-y-3 min-w-0">
          {/* Price chart panel */}
          <div className="bg-panel shadow-panel rounded-lg border border-border overflow-hidden">
            <div className="px-3 pt-3 pb-1">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
                Price
              </span>
            </div>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-[320px] text-muted text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse-slow" />
                </div>
              }
            >
              <PriceChart venue={venue} symbol={symbol} />
            </Suspense>
          </div>

          {/* Depth chart panel */}
          <div>
            <DepthChart book={book} />
          </div>
        </div>

        {/* Right column: order book */}
        <div className="min-w-0">
          <div className="bg-panel shadow-panel rounded-lg border border-border overflow-hidden h-full flex flex-col">
            <div className="px-3 pt-3 pb-1 shrink-0">
              <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
                Order Book
              </span>
            </div>
            <div className="flex-1 min-h-0 p-1">
              <L2Table book={book} levels={15} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
