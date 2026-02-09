import { Link } from 'react-router-dom';

const FEATURES = [
  {
    tag: 'Real-time',
    title: 'Live Order Books',
    description:
      'L2 depth data streamed from Binance WebSocket and Solana OpenBook DEX. Up to 20 levels of bid/ask depth with sub-second updates.',
  },
  {
    tag: 'Analytics',
    title: 'Spread Analytics',
    description:
      'Track mid price, absolute spread, spread in basis points, and microprice -- all computed and updated in real-time as the book changes.',
  },
  {
    tag: 'Simulation',
    title: 'Impact Simulator',
    description:
      'Estimate average fill price, slippage in basis points, and number of levels consumed for any hypothetical market order size.',
  },
  {
    tag: 'Comparison',
    title: 'CEX vs DEX',
    description:
      'Compare liquidity depth, spread, and price impact side-by-side across centralized and decentralized venues for the same asset.',
  },
];

const STATS = [
  { label: 'Trading Pairs', value: '3' },
  { label: 'Venues', value: '2' },
  { label: 'Latency', value: '<1s' },
  { label: 'Data', value: 'Real-time L2' },
];

const DISCLAIMERS = [
  'Data is delayed by network latency and should not be used for execution decisions.',
  'Order book snapshots may not reflect the full depth available on each venue.',
  'This tool is for educational and analytical purposes only.',
  'OpenBook data is polled at a lower frequency than Binance streaming data.',
];

export default function Landing() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-16 font-sans">
      {/* Hero */}
      <section className="text-center space-y-6 pt-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none">
          <span className="text-text-primary">LIQUIDITY</span>
          <br />
          <span className="text-accent glow-blue">SIMULATOR</span>
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Real-time order book depth, spread analytics, and price impact simulation
          across centralized and decentralized exchanges
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            to="/book"
            className="px-6 py-2.5 text-sm font-semibold rounded-md bg-accent text-white shadow-glow-blue hover:brightness-110 transition-all duration-200"
          >
            Open Order Book
          </Link>
          <Link
            to="/impact"
            className="px-6 py-2.5 text-sm font-semibold rounded-md border border-border-bright text-text-primary hover:bg-elevated hover:border-accent/40 hover:shadow-glow-blue transition-all duration-200"
          >
            Impact Simulator
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-panel shadow-panel rounded-lg border border-border">
        <div className="flex items-center justify-center divide-x divide-border">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex-1 text-center py-3 px-4">
              <span className="font-mono tabular-nums text-sm font-semibold text-text-primary">
                {stat.value}
              </span>
              <span className="text-muted text-xs ml-2">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-panel shadow-panel rounded-lg border border-border p-5 space-y-3 panel-highlight hover:shadow-panel-hover transition-shadow duration-300 group"
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-accent">
                {f.tag}
              </div>
              <h3 className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported venues */}
      <section className="space-y-4">
        <h2 className="font-sans text-[10px] uppercase tracking-wider text-muted px-1">
          Supported Venues
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Binance */}
          <div className="bg-panel shadow-panel rounded-lg border border-border p-5 space-y-3 border-l-2 border-l-accent">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent shadow-glow-blue" />
              <span className="text-sm font-semibold text-text-primary">Binance</span>
              <span className="text-[10px] text-muted uppercase tracking-wider bg-elevated px-2 py-0.5 rounded">CEX</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['SOL/USDT', 'BTC/USDT', 'ETH/USDT'].map((pair) => (
                <span
                  key={pair}
                  className="font-mono text-[11px] tabular-nums text-text-secondary bg-elevated border border-border rounded px-2 py-0.5"
                >
                  {pair}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              L2 depth via WebSocket stream with real-time updates
            </p>
          </div>

          {/* OpenBook */}
          <div className="bg-panel shadow-panel rounded-lg border border-border p-5 space-y-3 border-l-2 border-l-violet">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet shadow-glow-violet" />
              <span className="text-sm font-semibold text-text-primary">OpenBook</span>
              <span className="text-[10px] text-muted uppercase tracking-wider bg-elevated px-2 py-0.5 rounded">DEX / Solana</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="font-mono text-[11px] tabular-nums text-text-secondary bg-elevated border border-border rounded px-2 py-0.5">
                SOL/USDC
              </span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              On-chain order book on Solana via RPC polling
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="space-y-3">
        <div className="bg-elevated/50 border border-border rounded-lg p-5 space-y-3">
          <h2 className="font-sans text-[10px] uppercase tracking-wider text-muted">
            Limitations & Disclaimers
          </h2>
          <ul className="space-y-2">
            {DISCLAIMERS.map((d, i) => (
              <li key={i} className="text-[11px] text-muted leading-relaxed flex gap-2.5">
                <span className="text-border-bright mt-0.5 shrink-0 select-none">--</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
