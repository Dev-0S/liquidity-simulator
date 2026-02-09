import { useState, useContext, useMemo } from 'react';
import { OrderBookContext } from '../App';
import { simulateImpact } from '../lib/simulator';
import { calcMid, calcSpreadBps } from '../lib/metrics';
import { Book } from '../lib/types';

interface ComparisonAsset {
  label: string;
  binanceSymbol: string;
  openbookSymbol: string | null;
}

const COMPARISON_ASSETS: ComparisonAsset[] = [
  { label: 'SOL', binanceSymbol: 'SOLUSDT', openbookSymbol: 'SOLUSDC' },
];

const NOTIONAL_PRESETS = [
  { label: '1k', value: 1_000 },
  { label: '10k', value: 10_000 },
  { label: '100k', value: 100_000 },
  { label: '1M', value: 1_000_000 },
];

function formatPrice(price: number): string {
  if (price === 0) return '--';
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatBps(bps: number): string {
  return bps.toFixed(2);
}

function formatSize(size: number): string {
  if (size === 0) return '--';
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(2)}M`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(2)}K`;
  return size.toFixed(4);
}

function formatQuote(value: number): string {
  if (value === 0) return '--';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function slippageColor(bps: number): string {
  if (bps > 10) return 'text-ask';
  if (bps > 3) return 'text-yellow-500';
  return 'text-bid';
}

interface VenueCardProps {
  venueName: string;
  venueTag: string;
  book: Book | undefined;
  notional: number;
  accentClass: string;
  accentBorder: string;
  glowClass: string;
}

function VenueCard({ venueName, venueTag, book, notional, accentClass, accentBorder, glowClass }: VenueCardProps) {
  const metrics = useMemo(() => {
    if (!book || book.bids.length === 0 || book.asks.length === 0) return null;

    const bestBid = book.bids[0][0];
    const bestAsk = book.asks[0][0];
    const mid = calcMid(bestBid, bestAsk);
    const spreadBps = calcSpreadBps(bestBid, bestAsk);
    const bidSize = book.bids[0][1];
    const askSize = book.asks[0][1];

    const buyImpact = simulateImpact(book, 'buy', 'quote', notional);
    const sellImpact = simulateImpact(book, 'sell', 'quote', notional);

    return { bestBid, bestAsk, mid, spreadBps, bidSize, askSize, buyImpact, sellImpact };
  }, [book, notional]);

  const isLive = book && Date.now() - book.ts < 5000;

  return (
    <div className={`bg-panel shadow-panel rounded-lg border border-border overflow-hidden ${accentBorder}`}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-text-primary">{venueName}</h3>
          <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${accentClass} bg-opacity-10`}>
            {venueTag}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? 'bg-bid live-dot' : book ? 'bg-yellow-500 animate-pulse-slow' : 'bg-ask'
            } ${isLive ? glowClass : ''}`}
          />
          <span className="text-[10px] text-muted font-medium">
            {isLive ? 'Live' : book ? 'Stale' : 'Offline'}
          </span>
        </div>
      </div>

      {!metrics ? (
        <div className="text-xs text-muted py-10 text-center flex flex-col items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse-slow" />
          No data available
        </div>
      ) : (
        <div className="p-5 space-y-5">
          {/* Top of book */}
          <div className="space-y-2.5">
            <div className="font-sans text-[10px] uppercase tracking-wider text-muted">
              Top of Book
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface rounded-md px-3 py-2 border border-border">
                <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Best Bid</div>
                <div className="font-mono tabular-nums text-sm text-bid font-medium">
                  {formatPrice(metrics.bestBid)}
                </div>
                <div className="font-mono tabular-nums text-[10px] text-muted mt-0.5">
                  {formatSize(metrics.bidSize)}
                </div>
              </div>
              <div className="bg-surface rounded-md px-3 py-2 border border-border">
                <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Best Ask</div>
                <div className="font-mono tabular-nums text-sm text-ask font-medium">
                  {formatPrice(metrics.bestAsk)}
                </div>
                <div className="font-mono tabular-nums text-[10px] text-muted mt-0.5">
                  {formatSize(metrics.askSize)}
                </div>
              </div>
            </div>
          </div>

          {/* Spread */}
          <div className="space-y-2">
            <div className="font-sans text-[10px] uppercase tracking-wider text-muted">Spread</div>
            <div className="text-2xl font-mono tabular-nums font-bold text-text-primary">
              {formatBps(metrics.spreadBps)} <span className="text-sm text-text-secondary font-normal">bps</span>
            </div>
          </div>

          {/* Impact results */}
          <div className="space-y-2.5">
            <div className="font-sans text-[10px] uppercase tracking-wider text-muted">
              Impact @ {formatQuote(notional)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Buy impact */}
              <div className="bg-surface rounded-md p-3 border border-bid/10 space-y-2">
                <div className="text-[10px] font-bold text-bid uppercase tracking-wider">Buy</div>
                <div className="space-y-1.5 text-[11px] font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-muted">Avg Price</span>
                    <span className="text-text-primary">{formatPrice(metrics.buyImpact.avgPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Slippage</span>
                    <span className={slippageColor(metrics.buyImpact.slippageBpsVsMid)}>
                      {formatBps(metrics.buyImpact.slippageBpsVsMid)} bps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Filled</span>
                    <span className="text-text-primary">{formatSize(metrics.buyImpact.filledBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Levels</span>
                    <span className="text-text-secondary">{metrics.buyImpact.levelsConsumed.length}</span>
                  </div>
                </div>
              </div>

              {/* Sell impact */}
              <div className="bg-surface rounded-md p-3 border border-ask/10 space-y-2">
                <div className="text-[10px] font-bold text-ask uppercase tracking-wider">Sell</div>
                <div className="space-y-1.5 text-[11px] font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-muted">Avg Price</span>
                    <span className="text-text-primary">{formatPrice(metrics.sellImpact.avgPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Slippage</span>
                    <span className={slippageColor(metrics.sellImpact.slippageBpsVsMid)}>
                      {formatBps(metrics.sellImpact.slippageBpsVsMid)} bps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Filled</span>
                    <span className="text-text-primary">{formatSize(metrics.sellImpact.filledBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Levels</span>
                    <span className="text-text-secondary">{metrics.sellImpact.levelsConsumed.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ComparisonSummaryProps {
  binanceBook: Book;
  openbookBook: Book;
  notional: number;
}

function ComparisonSummary({ binanceBook, openbookBook, notional }: ComparisonSummaryProps) {
  const comparison = useMemo(() => {
    const bSpread = calcSpreadBps(binanceBook.bids[0]?.[0] ?? 0, binanceBook.asks[0]?.[0] ?? 0);
    const oSpread = calcSpreadBps(
      openbookBook.bids[0]?.[0] ?? 0,
      openbookBook.asks[0]?.[0] ?? 0
    );

    const bBuyImpact = simulateImpact(binanceBook, 'buy', 'quote', notional);
    const oBuyImpact = simulateImpact(openbookBook, 'buy', 'quote', notional);
    const bSellImpact = simulateImpact(binanceBook, 'sell', 'quote', notional);
    const oSellImpact = simulateImpact(openbookBook, 'sell', 'quote', notional);

    return { bSpread, oSpread, bBuyImpact, oBuyImpact, bSellImpact, oSellImpact };
  }, [binanceBook, openbookBook, notional]);

  const tighterSpread = comparison.bSpread <= comparison.oSpread ? 'Binance' : 'OpenBook';
  const betterBuy =
    comparison.bBuyImpact.slippageBpsVsMid <= comparison.oBuyImpact.slippageBpsVsMid
      ? 'Binance'
      : 'OpenBook';
  const betterSell =
    comparison.bSellImpact.slippageBpsVsMid <= comparison.oSellImpact.slippageBpsVsMid
      ? 'Binance'
      : 'OpenBook';

  const metrics = [
    {
      label: 'Tighter Spread',
      winner: tighterSpread,
      binanceVal: `${formatBps(comparison.bSpread)} bps`,
      openbookVal: `${formatBps(comparison.oSpread)} bps`,
    },
    {
      label: 'Better Buy',
      winner: betterBuy,
      binanceVal: `${formatBps(comparison.bBuyImpact.slippageBpsVsMid)} bps`,
      openbookVal: `${formatBps(comparison.oBuyImpact.slippageBpsVsMid)} bps`,
    },
    {
      label: 'Better Sell',
      winner: betterSell,
      binanceVal: `${formatBps(comparison.bSellImpact.slippageBpsVsMid)} bps`,
      openbookVal: `${formatBps(comparison.oSellImpact.slippageBpsVsMid)} bps`,
    },
  ];

  return (
    <div className="bg-panel shadow-panel rounded-lg border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <span className="font-sans text-[10px] uppercase tracking-wider text-muted">
          Comparison Summary
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {metrics.map((m) => (
          <div key={m.label} className="p-5 space-y-3">
            <div className="font-sans text-[10px] uppercase tracking-wider text-muted">{m.label}</div>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-bold ${
                  m.winner === 'Binance'
                    ? 'text-accent glow-blue'
                    : 'text-violet'
                }`}
              >
                {m.winner}
              </span>
              <svg className="w-3.5 h-3.5 text-bid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-1 text-[11px] font-mono tabular-nums">
              <div className="flex justify-between">
                <span className={`${m.winner === 'Binance' ? 'text-accent font-semibold' : 'text-text-secondary'}`}>
                  Binance
                </span>
                <span className={`${m.winner === 'Binance' ? 'text-text-primary font-semibold' : 'text-muted'}`}>
                  {m.binanceVal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`${m.winner === 'OpenBook' ? 'text-violet font-semibold' : 'text-text-secondary'}`}>
                  OpenBook
                </span>
                <span className={`${m.winner === 'OpenBook' ? 'text-text-primary font-semibold' : 'text-muted'}`}>
                  {m.openbookVal}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Compare() {
  const { getBook } = useContext(OrderBookContext);
  const [selectedAsset, setSelectedAsset] = useState<ComparisonAsset>(COMPARISON_ASSETS[0]);
  const [notionalStr, setNotionalStr] = useState('10000');

  const notional = useMemo(() => {
    const parsed = parseFloat(notionalStr);
    return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [notionalStr]);

  const binanceBook = getBook('binance', selectedAsset.binanceSymbol);
  const openbookBook = selectedAsset.openbookSymbol
    ? getBook('openbook', selectedAsset.openbookSymbol)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="bg-panel shadow-panel rounded-lg border border-border p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Asset selector */}
          <div className="flex items-center gap-3">
            <div className="flex rounded-md overflow-hidden border border-border">
              {COMPARISON_ASSETS.map((asset) => (
                <button
                  key={asset.label}
                  onClick={() => setSelectedAsset(asset)}
                  className={`px-4 py-2 text-xs font-semibold transition-all duration-150 ${
                    selectedAsset.label === asset.label
                      ? 'bg-elevated text-text-primary'
                      : 'bg-surface text-muted hover:text-text-secondary'
                  }`}
                >
                  {asset.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-text-secondary hidden sm:inline">
              {selectedAsset.binanceSymbol}
              <span className="text-muted"> vs </span>
              {selectedAsset.openbookSymbol ?? 'N/A'}
            </span>
          </div>

          {/* Notional input + presets */}
          <div className="flex items-center gap-3">
            <label className="font-sans text-[10px] text-muted uppercase tracking-wider">Notional</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={notionalStr}
                onChange={(e) => setNotionalStr(e.target.value)}
                className="w-28 bg-surface border border-border rounded-md px-3 py-1.5 text-xs font-mono tabular-nums text-text-primary outline-none focus:border-accent/50 focus:shadow-glow-blue transition-all duration-200"
              />
            </div>
            <div className="flex gap-1.5">
              {NOTIONAL_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setNotionalStr(String(p.value))}
                  className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-md border transition-all duration-150 font-mono tabular-nums ${
                    notional === p.value
                      ? 'border-accent/40 bg-accent/10 text-accent shadow-glow-blue'
                      : 'border-border text-muted hover:text-text-secondary hover:border-border-bright'
                  }`}
                >
                  ${p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side venue cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VenueCard
          venueName="Binance"
          venueTag="CEX"
          book={binanceBook}
          notional={notional}
          accentClass="text-accent"
          accentBorder="border-l-2 border-l-accent"
          glowClass="shadow-glow-blue"
        />
        <VenueCard
          venueName="OpenBook"
          venueTag="DEX"
          book={openbookBook}
          notional={notional}
          accentClass="text-violet"
          accentBorder="border-l-2 border-l-violet"
          glowClass="shadow-glow-violet"
        />
      </div>

      {/* Comparison summary */}
      {binanceBook && openbookBook && notional > 0 && (
        <ComparisonSummary
          binanceBook={binanceBook}
          openbookBook={openbookBook}
          notional={notional}
        />
      )}
    </div>
  );
}
