import { Connection, PublicKey } from '@solana/web3.js';
import { SUPPORTED_PAIRS, SOLANA_RPC_URL } from '../config';
import { normalizeOpenBook } from '../lib/normalize';
import { Book, BookLevel, PairConfig } from '../types';

const PREFIX = '[openbook]';
const POLL_INTERVAL_MS = 2_000;

type OpenBookPoller = {
  pair: PairConfig;
  timer: ReturnType<typeof setInterval> | null;
};

const pollers: OpenBookPoller[] = [];
let connection: Connection | null = null;

/**
 * Decode an OpenBook/Serum order book from raw account data.
 *
 * TODO: Full decode process for OpenBook v1 (Serum-compatible) order books:
 * 1. Fetch the market account and deserialize it to get bidsAddress / asksAddress.
 * 2. Fetch both the bids and asks slab accounts.
 * 3. Each slab is a custom red-black tree structure with the layout:
 *    - 5-byte header (blob), then 4-byte padding, then u32 bumpIndex, padding,
 *      u32 freeListLen, u32 freeListHead, blob root, blob leaf count, padding.
 *    - The slab nodes follow; each node is either InnerNode or LeafNode.
 *    - LeafNodes contain: ownerSlot, feeTier, padding, key (u128), owner (pubkey),
 *      quantity (u64).
 *    - The price is encoded in the upper 64 bits of the 128-bit key.
 *    - Price must be converted from lots using baseLotSize and quoteLotSize from
 *      the market account.
 * 4. Walk the slab tree in-order to produce sorted price levels, aggregating
 *    quantities at each price.
 *
 * For now we return mock data to allow the rest of the system to function.
 * Replace this stub with the real decode once @project-serum/serum or a
 * custom slab parser is integrated.
 */
function decodeOrderbook(
  _marketAddress: string,
  _accountData: Buffer | null,
): { bids: BookLevel[]; asks: BookLevel[] } {
  // Generate realistic mock SOL/USDC levels around a base price.
  // In production, this would parse the slab account data as described above.
  const basePrice = 135 + (Math.random() - 0.5) * 2; // ~$134-136 SOL
  const spread = 0.01;

  const bids: BookLevel[] = [];
  const asks: BookLevel[] = [];

  for (let i = 0; i < 10; i++) {
    const bidPrice = parseFloat(
      (basePrice - spread - i * 0.02 - Math.random() * 0.01).toFixed(4),
    );
    const askPrice = parseFloat(
      (basePrice + spread + i * 0.02 + Math.random() * 0.01).toFixed(4),
    );

    const bidSize = parseFloat((5 + Math.random() * 50).toFixed(2));
    const askSize = parseFloat((5 + Math.random() * 50).toFixed(2));

    bids.push([bidPrice, bidSize]);
    asks.push([askPrice, askSize]);
  }

  return { bids, asks };
}

/**
 * Poll a single OpenBook market, decode its order book, and deliver updates.
 */
async function pollMarket(
  pair: PairConfig,
  onBook: (book: Book) => void,
): Promise<void> {
  if (!connection) {
    console.error(`${PREFIX} No Solana connection available`);
    return;
  }

  if (!pair.openbookMarket) {
    return;
  }

  try {
    const marketPubkey = new PublicKey(pair.openbookMarket);
    const accountInfo = await connection.getAccountInfo(marketPubkey);

    const accountData = accountInfo ? accountInfo.data : null;
    const { bids, asks } = decodeOrderbook(pair.openbookMarket, accountData);

    const book = normalizeOpenBook(pair.symbol, bids, asks);
    onBook(book);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `${PREFIX} Error polling ${pair.symbol}: ${message}`,
    );
    // Continue polling; do not throw.
  }
}

/**
 * Start polling for all OpenBook pairs defined in config.
 */
export function startOpenBook(onBook: (book: Book) => void): void {
  const openbookPairs = SUPPORTED_PAIRS.filter(
    (p) => p.venue === 'openbook' && p.openbookMarket,
  );

  if (openbookPairs.length === 0) {
    console.log(`${PREFIX} No OpenBook pairs configured; skipping.`);
    return;
  }

  console.log(
    `${PREFIX} Starting polling for ${openbookPairs.length} pair(s) (interval=${POLL_INTERVAL_MS}ms)`,
  );
  console.log(`${PREFIX} RPC: ${SOLANA_RPC_URL}`);

  connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  for (const pair of openbookPairs) {
    // Initial poll immediately
    pollMarket(pair, onBook);

    const timer = setInterval(() => {
      pollMarket(pair, onBook);
    }, POLL_INTERVAL_MS);

    pollers.push({ pair, timer });
  }
}

/**
 * Stop all OpenBook polling and clean up resources.
 */
export function stopOpenBook(): void {
  console.log(`${PREFIX} Stopping all pollers`);

  for (const poller of pollers) {
    if (poller.timer) {
      clearInterval(poller.timer);
      poller.timer = null;
    }
  }

  pollers.length = 0;
  connection = null;
}
