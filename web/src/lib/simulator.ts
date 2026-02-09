import { Book, ImpactResult } from './types';
import { calcMid } from './metrics';

/**
 * Simulate the price impact of a market order against an L2 order book.
 *
 * @param book   - Current order book snapshot
 * @param side   - 'buy' (lift asks) or 'sell' (hit bids)
 * @param inputMode - 'base' = specify base quantity, 'quote' = specify quote notional
 * @param amount - The order size in the units specified by inputMode
 * @returns ImpactResult with fill details, slippage, and levels consumed
 */
export function simulateImpact(
  book: Book,
  side: 'buy' | 'sell',
  inputMode: 'base' | 'quote',
  amount: number
): ImpactResult {
  if (amount <= 0 || book.bids.length === 0 || book.asks.length === 0) {
    return {
      filledBase: 0,
      spentQuote: 0,
      avgPrice: 0,
      slippageBpsVsMid: 0,
      levelsConsumed: [],
      unfilledBase: inputMode === 'base' ? amount : 0,
    };
  }

  const mid = calcMid(book.bids[0][0], book.asks[0][0]);

  // Select the side of the book we consume
  // BUY: walk asks from lowest price upward
  // SELL: walk bids from highest price downward
  const levels: [number, number][] =
    side === 'buy'
      ? [...book.asks].sort((a, b) => a[0] - b[0])
      : [...book.bids].sort((a, b) => b[0] - a[0]);

  let filledBase = 0;
  let spentQuote = 0;
  let remaining = amount;
  const levelsConsumed: { price: number; qty: number }[] = [];

  for (const [price, size] of levels) {
    if (remaining <= 0) break;

    if (inputMode === 'base') {
      // Fill until we've accumulated enough base
      const fillQty = Math.min(size, remaining);
      const fillCost = fillQty * price;

      filledBase += fillQty;
      spentQuote += fillCost;
      remaining -= fillQty;
      levelsConsumed.push({ price, qty: fillQty });
    } else {
      // inputMode === 'quote': fill until we've spent/received enough quote
      const maxQuoteAtLevel = size * price;

      if (maxQuoteAtLevel <= remaining) {
        // Consume the entire level
        filledBase += size;
        spentQuote += maxQuoteAtLevel;
        remaining -= maxQuoteAtLevel;
        levelsConsumed.push({ price, qty: size });
      } else {
        // Partial fill at this level
        const partialBase = remaining / price;
        filledBase += partialBase;
        spentQuote += remaining;
        remaining = 0;
        levelsConsumed.push({ price, qty: partialBase });
      }
    }
  }

  const avgPrice = filledBase > 0 ? spentQuote / filledBase : 0;

  // Calculate slippage in bps vs mid
  let slippageBpsVsMid = 0;
  if (mid > 0 && avgPrice > 0) {
    if (side === 'buy') {
      // For buys, slippage is how much MORE we pay vs mid
      slippageBpsVsMid = ((avgPrice - mid) / mid) * 10_000;
    } else {
      // For sells, slippage is how much LESS we receive vs mid
      slippageBpsVsMid = ((mid - avgPrice) / mid) * 10_000;
    }
  }

  // Calculate unfilled base
  let unfilledBase = 0;
  if (inputMode === 'base') {
    unfilledBase = Math.max(0, remaining);
  } else {
    // If we ran out of levels while in quote mode,
    // we can't easily express unfilled in base, but remaining quote is telling
    // We'll convert remaining quote to approximate base at last price or mid
    if (remaining > 0 && mid > 0) {
      unfilledBase = remaining / mid;
    }
  }

  return {
    filledBase,
    spentQuote,
    avgPrice,
    slippageBpsVsMid,
    levelsConsumed,
    unfilledBase,
  };
}
