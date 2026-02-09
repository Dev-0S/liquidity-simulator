import { useMemo } from 'react';
import { Book } from '../lib/types';
import { calcSpreadAbs, calcSpreadBps } from '../lib/metrics';

interface Props {
  book: Book | undefined;
  levels?: number;
}

interface RowData {
  price: number;
  size: number;
  cumulative: number;
}

function formatNum(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

function getPriceDecimals(price: number): number {
  if (price >= 1000) return 2;
  if (price >= 1) return 4;
  return 6;
}

function getSizeDecimals(price: number): number {
  if (price >= 1000) return 5;
  if (price >= 1) return 3;
  return 2;
}

export default function L2Table({ book, levels = 15 }: Props) {
  const { bidRows, askRows, maxCumulative, spreadAbs, spreadBps, priceDecimals, sizeDecimals } =
    useMemo(() => {
      if (!book || book.bids.length === 0 || book.asks.length === 0) {
        return {
          bidRows: [] as RowData[],
          askRows: [] as RowData[],
          maxCumulative: 0,
          spreadAbs: 0,
          spreadBps: 0,
          priceDecimals: 2,
          sizeDecimals: 4,
        };
      }

      const topPrice = book.bids[0][0];
      const pd = getPriceDecimals(topPrice);
      const sd = getSizeDecimals(topPrice);

      // Bids: sorted highest to lowest (already should be)
      const bids = book.bids.slice(0, levels);
      let cum = 0;
      const bidRows: RowData[] = bids.map(([price, size]) => {
        cum += size;
        return { price, size, cumulative: cum };
      });

      // Asks: sorted lowest to highest (already should be)
      const asks = book.asks.slice(0, levels);
      cum = 0;
      const askRows: RowData[] = asks.map(([price, size]) => {
        cum += size;
        return { price, size, cumulative: cum };
      });

      const maxCum = Math.max(
        bidRows.length > 0 ? bidRows[bidRows.length - 1].cumulative : 0,
        askRows.length > 0 ? askRows[askRows.length - 1].cumulative : 0
      );

      const sAbs = calcSpreadAbs(book.bids[0][0], book.asks[0][0]);
      const sBps = calcSpreadBps(book.bids[0][0], book.asks[0][0]);

      return {
        bidRows,
        askRows,
        maxCumulative: maxCum,
        spreadAbs: sAbs,
        spreadBps: sBps,
        priceDecimals: pd,
        sizeDecimals: sd,
      };
    }, [book, levels]);

  const rowCount = Math.max(bidRows.length, askRows.length);

  if (!book || rowCount === 0) {
    return (
      <div className="bg-panel shadow-panel rounded-lg border border-border flex items-center justify-center text-muted text-xs h-full min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse-slow" />
          <span>Waiting for order book data...</span>
        </div>
      </div>
    );
  }

  const barWidth = (cumulative: number) =>
    maxCumulative > 0 ? (cumulative / maxCumulative) * 100 : 0;

  return (
    <div className="bg-panel shadow-panel rounded-lg border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr] border-b border-border bg-elevated/50">
        {/* Bid header */}
        <div className="grid grid-cols-[1fr_1fr_1.3fr] px-2 py-2">
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted">Cum</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted text-right">Size</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-bid-dim text-right">Bid</span>
        </div>
        {/* Ask header */}
        <div className="grid grid-cols-[1.3fr_1fr_1fr] px-2 py-2">
          <span className="font-sans text-[10px] uppercase tracking-wider text-ask-dim">Ask</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted text-right">Size</span>
          <span className="font-sans text-[10px] uppercase tracking-wider text-muted text-right">Cum</span>
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: rowCount }).map((_, i) => {
          const bid = bidRows[i];
          const ask = askRows[i];
          const isEven = i % 2 === 0;

          return (
            <div
              key={i}
              className={`grid grid-cols-[1fr_1fr] transition-colors duration-75 hover:brightness-125 ${
                isEven ? 'bg-panel' : 'bg-elevated/20'
              }`}
            >
              {/* Bid side */}
              <div className="grid grid-cols-[1fr_1fr_1.3fr] px-2 py-[3px] text-xs font-mono tabular-nums relative overflow-hidden">
                {bid && (
                  <>
                    {/* Depth bar: grows from right (center) toward left */}
                    <div
                      className="absolute inset-y-0 right-0 pointer-events-none transition-[width] duration-150 ease-out"
                      style={{
                        width: `${barWidth(bid.cumulative)}%`,
                        background: 'linear-gradient(to left, rgba(34,197,94,0.12), rgba(34,197,94,0.03))',
                      }}
                    />
                    {barWidth(bid.cumulative) > 85 && (
                      <div
                        className="absolute inset-y-0 left-0 w-px pointer-events-none opacity-30"
                        style={{ boxShadow: '0 0 6px 1px rgba(34,197,94,0.4)' }}
                      />
                    )}
                    <span className="text-muted relative z-10 text-[11px]">
                      {formatNum(bid.cumulative, sizeDecimals)}
                    </span>
                    <span className="text-right text-text-secondary relative z-10 text-[11px]">
                      {formatNum(bid.size, sizeDecimals)}
                    </span>
                    <span className="text-right text-bid relative z-10 text-[11px] font-medium">
                      {formatNum(bid.price, priceDecimals)}
                    </span>
                  </>
                )}
              </div>

              {/* Ask side */}
              <div className="grid grid-cols-[1.3fr_1fr_1fr] px-2 py-[3px] text-xs font-mono tabular-nums relative overflow-hidden border-l border-border/30">
                {ask && (
                  <>
                    {/* Depth bar: grows from left (center) toward right */}
                    <div
                      className="absolute inset-y-0 left-0 pointer-events-none transition-[width] duration-150 ease-out"
                      style={{
                        width: `${barWidth(ask.cumulative)}%`,
                        background: 'linear-gradient(to right, rgba(239,68,68,0.12), rgba(239,68,68,0.03))',
                      }}
                    />
                    {barWidth(ask.cumulative) > 85 && (
                      <div
                        className="absolute inset-y-0 right-0 w-px pointer-events-none opacity-30"
                        style={{ boxShadow: '0 0 6px 1px rgba(239,68,68,0.4)' }}
                      />
                    )}
                    <span className="text-ask relative z-10 text-[11px] font-medium">
                      {formatNum(ask.price, priceDecimals)}
                    </span>
                    <span className="text-right text-text-secondary relative z-10 text-[11px]">
                      {formatNum(ask.size, sizeDecimals)}
                    </span>
                    <span className="text-right text-muted relative z-10 text-[11px]">
                      {formatNum(ask.cumulative, sizeDecimals)}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spread row */}
      <div className="border-t border-border-bright bg-elevated/60 px-3 py-1.5 flex items-center justify-center gap-4">
        <span className="font-sans text-[10px] uppercase tracking-wider text-muted">Spread</span>
        <span className="text-accent font-mono tabular-nums text-xs font-semibold glow-blue">
          {formatNum(spreadAbs, priceDecimals)}
        </span>
        <span className="text-text-secondary font-mono tabular-nums text-[11px]">
          {formatNum(spreadBps, 2)} bps
        </span>
      </div>
    </div>
  );
}
