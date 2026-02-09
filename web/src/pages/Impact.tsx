import { useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import PairSelector from '../components/PairSelector';
import SpreadMetrics from '../components/SpreadMetrics';
import LatencyBadge from '../components/LatencyBadge';
import { OrderBookContext } from '../App';
import { Venue, ImpactResult } from '../lib/types';
import { simulateImpact } from '../lib/simulator';

type Side = 'buy' | 'sell';
type InputMode = 'base' | 'quote';

const BASE_QUICK_FILLS = [1, 10, 100, 1000];
const QUOTE_QUICK_FILLS = [
  { label: '$1k', value: 1_000 },
  { label: '$10k', value: 10_000 },
  { label: '$100k', value: 100_000 },
  { label: '$1M', value: 1_000_000 },
];

function formatPrice(price: number): string {
  if (price === 0) return '--';
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatQty(qty: number): string {
  if (qty === 0) return '--';
  if (qty >= 1_000_000) return `${(qty / 1_000_000).toFixed(4)}M`;
  if (qty >= 1_000) return `${(qty / 1_000).toFixed(4)}K`;
  return qty.toFixed(6);
}

function formatQuote(value: number): string {
  if (value === 0) return '--';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBps(bps: number): string {
  if (bps === 0) return '0.00';
  return bps.toFixed(2);
}

function slippageColor(bps: number): string {
  if (bps > 10) return 'text-ask glow-red';
  if (bps > 3) return 'text-yellow-500';
  return 'text-bid glow-green';
}

export default function Impact() {
  const { getBook } = useContext(OrderBookContext);
  const [venue, setVenue] = useState<Venue>('binance');
  const [symbol, setSymbol] = useState('SOLUSDT');
  const [side, setSide] = useState<Side>('buy');
  const [inputMode, setInputMode] = useState<InputMode>('base');
  const [amount, setAmount] = useState<string>('10');

  const book = getBook(venue, symbol);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedAmount, setDebouncedAmount] = useState<number>(10);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const parsed = parseFloat(amount);
      setDebouncedAmount(isNaN(parsed) || parsed < 0 ? 0 : parsed);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [amount]);

  const result: ImpactResult | null = useMemo(() => {
    if (!book || debouncedAmount <= 0) return null;
    if (book.bids.length === 0 || book.asks.length === 0) return null;
    return simulateImpact(book, side, inputMode, debouncedAmount);
  }, [book, side, inputMode, debouncedAmount]);

  const isStale = book ? Date.now() - book.ts > 3000 : true;
  const insufficientDepth = result ? result.unfilledBase > 0 : false;

  const handleQuickFill = useCallback((value: number) => {
    setAmount(String(value));
  }, []);

  const getPriceDecimals = useCallback(() => {
    if (!book || book.bids.length === 0) return 2;
    const price = book.bids[0][0];
    if (price >= 1000) return 2;
    if (price >= 1) return 4;
    return 6;
  }, [book]);

  return (
    <div className="space-y-3">
      {/* Top bar */}
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

      {/* Spread metrics */}
      <SpreadMetrics book={book} />

      {/* Main content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-3">
        {/* Left: input panel */}
        <div className="bg-panel shadow-panel rounded-lg border border-border p-4 space-y-5">
          <div className="font-sans text-[10px] uppercase tracking-wider text-muted">
            Simulate Order
          </div>

          {/* Side toggle */}
          <div className="flex rounded-md overflow-hidden border border-border">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all duration-150 ${
                side === 'buy'
                  ? 'bg-bid/15 text-bid shadow-glow-green border-r border-border'
                  : 'bg-surface text-muted hover:text-text-secondary border-r border-border'
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all duration-150 ${
                side === 'sell'
                  ? 'bg-ask/15 text-ask shadow-glow-red'
                  : 'bg-surface text-muted hover:text-text-secondary'
              }`}
            >
              SELL
            </button>
          </div>

          {/* Input mode segmented control */}
          <div className="flex rounded-md overflow-hidden border border-border bg-surface">
            <button
              onClick={() => setInputMode('base')}
              className={`flex-1 py-2 text-[11px] font-semibold transition-all duration-150 ${
                inputMode === 'base'
                  ? 'bg-elevated text-text-primary shadow-sm'
                  : 'text-muted hover:text-text-secondary'
              }`}
            >
              Base Qty
            </button>
            <button
              onClick={() => setInputMode('quote')}
              className={`flex-1 py-2 text-[11px] font-semibold transition-all duration-150 ${
                inputMode === 'quote'
                  ? 'bg-elevated text-text-primary shadow-sm'
                  : 'text-muted hover:text-text-secondary'
              }`}
            >
              Quote Notional
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="font-sans text-[10px] text-muted uppercase tracking-wider block mb-1.5">
              {inputMode === 'base' ? 'Base Quantity' : 'Quote Notional (USD)'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface border border-border rounded-md px-4 py-3 text-lg font-mono tabular-nums text-text-primary outline-none focus:border-accent/50 focus:shadow-glow-blue transition-all duration-200 placeholder:text-muted/50"
                placeholder={inputMode === 'base' ? 'e.g. 100' : 'e.g. 10000'}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted uppercase tracking-wider">
                {inputMode === 'base' ? symbol.replace(/USDT|USDC/, '') : 'USD'}
              </span>
            </div>
          </div>

          {/* Quick fill buttons */}
          <div className="flex flex-wrap gap-1.5">
            {inputMode === 'base'
              ? BASE_QUICK_FILLS.map((v) => (
                  <button
                    key={v}
                    onClick={() => handleQuickFill(v)}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-md border transition-all duration-150 tabular-nums font-mono ${
                      debouncedAmount === v
                        ? 'border-accent/40 bg-accent/10 text-accent shadow-glow-blue'
                        : 'border-border text-muted hover:text-text-secondary hover:border-border-bright hover:bg-elevated/50'
                    }`}
                  >
                    {v}
                  </button>
                ))
              : QUOTE_QUICK_FILLS.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => handleQuickFill(q.value)}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-md border transition-all duration-150 tabular-nums font-mono ${
                      debouncedAmount === q.value
                        ? 'border-accent/40 bg-accent/10 text-accent shadow-glow-blue'
                        : 'border-border text-muted hover:text-text-secondary hover:border-border-bright hover:bg-elevated/50'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
          </div>
        </div>

        {/* Right: results panel */}
        <div className="space-y-3">
          {/* Warnings */}
          {isStale && book && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-md px-4 py-2.5 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse-slow shrink-0" />
              <span className="text-xs text-yellow-500/90">
                Order book data is stale. Results may not reflect current market conditions.
              </span>
            </div>
          )}
          {insufficientDepth && result && (
            <div className="bg-ask/5 border border-ask/20 rounded-md px-4 py-2.5 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-ask animate-pulse-slow shrink-0" />
              <span className="text-xs text-ask/90">
                Insufficient depth: {formatQty(result.unfilledBase)} base units could not be filled at available price levels.
              </span>
            </div>
          )}

          {result && result.filledBase > 0 ? (
            <>
              {/* Impact analysis header */}
              <div className="font-sans text-[10px] uppercase tracking-wider text-muted px-1">
                Impact Analysis
              </div>

              {/* Summary metric cards: 2x2 */}
              <div className="grid grid-cols-2 gap-3">
                {/* Avg Fill Price */}
                <div className="bg-panel shadow-panel rounded-lg border border-border p-4">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted mb-2">
                    Avg Fill Price
                  </div>
                  <div className="text-xl font-mono tabular-nums font-semibold text-text-primary">
                    {formatPrice(result.avgPrice)}
                  </div>
                </div>

                {/* Slippage */}
                <div className="bg-panel shadow-panel rounded-lg border border-border p-4">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted mb-2">
                    Slippage
                  </div>
                  <div className={`text-xl font-mono tabular-nums font-semibold ${slippageColor(result.slippageBpsVsMid)}`}>
                    {formatBps(result.slippageBpsVsMid)} <span className="text-sm">bps</span>
                  </div>
                </div>

                {/* Filled Qty */}
                <div className="bg-panel shadow-panel rounded-lg border border-border p-4">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted mb-2">
                    Filled Quantity
                  </div>
                  <div className="text-xl font-mono tabular-nums font-semibold text-text-primary">
                    {formatQty(result.filledBase)}
                  </div>
                </div>

                {/* Total Cost / Received */}
                <div className="bg-panel shadow-panel rounded-lg border border-border p-4">
                  <div className="font-sans text-[10px] uppercase tracking-wider text-muted mb-2">
                    {side === 'buy' ? 'Total Cost' : 'Total Received'}
                  </div>
                  <div className="text-xl font-mono tabular-nums font-semibold text-text-primary">
                    {formatQuote(result.spentQuote)}
                  </div>
                </div>
              </div>

              {/* Levels consumed table */}
              <div className="bg-panel shadow-panel rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
                    Levels Consumed
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-text-secondary">
                    {result.levelsConsumed.length}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px] font-mono tabular-nums">
                    <thead>
                      <tr className="text-[10px] font-sans text-muted uppercase tracking-wider border-b border-border bg-elevated/30">
                        <th className="text-left px-4 py-2 font-medium w-10">#</th>
                        <th className="text-right px-4 py-2 font-medium">Price</th>
                        <th className="text-right px-4 py-2 font-medium">Qty Filled</th>
                        <th className="text-right px-4 py-2 font-medium">Notional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.levelsConsumed.map((level, i) => (
                        <tr
                          key={i}
                          className={`hover:brightness-125 transition-colors ${
                            i % 2 === 0 ? 'bg-panel' : 'bg-elevated/15'
                          }`}
                        >
                          <td className="px-4 py-1.5 text-muted">{i + 1}</td>
                          <td
                            className={`px-4 py-1.5 text-right font-medium ${
                              side === 'buy' ? 'text-ask' : 'text-bid'
                            }`}
                          >
                            {level.price.toFixed(getPriceDecimals())}
                          </td>
                          <td className="px-4 py-1.5 text-right text-text-primary">
                            {formatQty(level.qty)}
                          </td>
                          <td className="px-4 py-1.5 text-right text-text-secondary">
                            {formatQuote(level.price * level.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-panel shadow-panel rounded-lg border border-border p-12 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-muted text-sm">
                  {!book
                    ? 'Waiting for order book data...'
                    : debouncedAmount <= 0
                    ? 'Enter an order size to simulate price impact.'
                    : 'No fill result. Check order parameters.'}
                </div>
                {!book && (
                  <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse-slow mx-auto" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
