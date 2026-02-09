# Liquidity + Spread + Impact Simulator

Real-time order book depth, spread metrics, and price impact simulation across CEX and DEX venues.

## What it does

- **Live Order Books** — Real-time L2 data from Binance (WebSocket) and Solana OpenBook (RPC polling)
- **Spread Analytics** — Mid, spread (absolute & bps), microprice metrics updated in real-time
- **Impact Simulator** — Estimate average fill price, slippage, and levels consumed for any order size
- **CEX vs DEX Compare** — Side-by-side liquidity comparison across venues for the same asset

## Supported Pairs

| Venue    | Pairs                          |
| -------- | ------------------------------ |
| Binance  | SOL/USDT, BTC/USDT, ETH/USDT  |
| OpenBook | SOL/USDC                       |

## Architecture

```
liquidity-simulator/
├── server/          Node.js + Express + ws
│   └── src/
│       ├── venues/  Binance WS + OpenBook RPC connectors
│       ├── ws/      WebSocket broadcast to frontend clients
│       ├── routes/  REST API (health, pairs, snapshots)
│       └── lib/     Normalization utilities
├── web/             Vite + React + TypeScript + Tailwind
│   └── src/
│       ├── pages/   Landing, Orderbook, Impact, Compare
│       ├── components/  AppShell, L2Table, DepthChart, etc.
│       ├── hooks/   useOrderBook (WS connection + state)
│       └── lib/     Simulator engine, metrics, types
└── package.json     Workspace root
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone and install
git clone <repo-url>
cd liquidity-simulator
npm install

# Configure (optional)
cp server/.env.example server/.env
# Edit server/.env if you want to customize:
#   PORT=3001
#   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Run both server and frontend concurrently
npm run dev
```

The web app will be available at `http://localhost:5173`. The server runs on port 3001 (proxied by Vite).

### Run individually

```bash
npm run dev:server   # Server only (port 3001)
npm run dev:web      # Frontend only (port 5173)
```

### Build for production

```bash
npm run build
```

## API Endpoints

| Method | Path                              | Description                  |
| ------ | --------------------------------- | ---------------------------- |
| GET    | `/api/health`                     | Health check                 |
| GET    | `/api/pairs`                      | List supported pairs         |
| GET    | `/api/venues`                     | List supported venues        |
| GET    | `/api/snapshot?venue=...&symbol=...` | Latest cached book snapshot |
| WS     | `/ws`                             | Real-time book updates       |

## WebSocket Messages

Messages are JSON with a `type` field:

```jsonc
// Server -> Client
{ "type": "book_update", "data": { "ts": 1234567890, "venue": "binance", "symbol": "SOLUSDT", "bids": [[100.5, 10], ...], "asks": [[100.6, 5], ...] } }
{ "type": "snapshot",    "data": { /* same shape */ } }
```

## Core Calculations

### Spread Metrics

- **Mid price**: `(bestBid + bestAsk) / 2`
- **Spread (abs)**: `bestAsk - bestBid`
- **Spread (bps)**: `spreadAbs / mid * 10,000`
- **Microprice**: `(bestBid * askSize + bestAsk * bidSize) / (bidSize + askSize)`

### Impact Simulator

For a **buy** of size Q:
1. Walk asks from lowest price upward
2. Fill at each level until Q is exhausted
3. `avgPrice = totalSpent / totalFilled`
4. `slippage (bps) = (avgPrice - mid) / mid * 10,000`

For a **sell**: same logic walking bids from highest price downward.

## Limitations & Disclaimers

- Data is delayed by network latency and WebSocket propagation — this is **not** a real-time trading feed
- Order book snapshots may not reflect the full depth available on the venue
- OpenBook data is polled every ~2 seconds (not streaming)
- Impact simulation is theoretical and does not account for hidden liquidity, queue priority, or other orders
- **This tool is for educational and analytical purposes only — not execution advice**

## Tech Stack

- **Backend**: Node.js, TypeScript, Express, ws, @solana/web3.js
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router
- **Data**: Binance public WebSocket API, Solana RPC (OpenBook)

## License

MIT
