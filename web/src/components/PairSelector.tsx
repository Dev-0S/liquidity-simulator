import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Venue, SUPPORTED_PAIRS } from '../lib/types';

interface Props {
  selectedVenue: Venue;
  selectedSymbol: string;
  onSelect: (venue: Venue, symbol: string) => void;
}

const VENUES: { key: Venue; label: string }[] = [
  { key: 'binance', label: 'Binance' },
  { key: 'openbook', label: 'OpenBook' },
];

export default function PairSelector({ selectedVenue, selectedSymbol, onSelect }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync selection from URL on mount
  useEffect(() => {
    const urlVenue = searchParams.get('venue') as Venue | null;
    const urlSymbol = searchParams.get('symbol');
    if (urlVenue && urlSymbol) {
      const exists = SUPPORTED_PAIRS.some(
        (p) => p.venue === urlVenue && p.symbol === urlSymbol
      );
      if (exists) {
        onSelect(urlVenue, urlSymbol);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selection to URL
  useEffect(() => {
    setSearchParams(
      { venue: selectedVenue, symbol: selectedSymbol },
      { replace: true }
    );
  }, [selectedVenue, selectedSymbol, setSearchParams]);

  const pairsForVenue = SUPPORTED_PAIRS.filter((p) => p.venue === selectedVenue);

  const handleVenueChange = (venue: Venue) => {
    const firstPair = SUPPORTED_PAIRS.find((p) => p.venue === venue);
    if (firstPair) {
      onSelect(venue, firstPair.symbol);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Venue segmented control */}
      <div className="flex rounded-lg bg-surface/70 border border-border p-0.5">
        {VENUES.map((v) => (
          <button
            key={v.key}
            onClick={() => handleVenueChange(v.key)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all font-sans ${
              selectedVenue === v.key
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-glow-blue'
                : 'text-muted hover:text-text-primary border border-transparent'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Pair pills */}
      <div className="flex gap-1.5">
        {pairsForVenue.map((pair) => (
          <button
            key={pair.symbol}
            onClick={() => onSelect(selectedVenue, pair.symbol)}
            className={`px-3 py-1.5 text-xs font-medium font-mono rounded-md border transition-all ${
              selectedSymbol === pair.symbol
                ? 'bg-elevated border-accent/30 text-text-primary shadow-panel-hover'
                : 'bg-panel border-border text-muted hover:border-border-bright hover:text-text-primary'
            }`}
          >
            {pair.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
