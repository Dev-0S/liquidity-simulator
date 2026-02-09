/**
 * Calculate the mid price from the best bid and best ask.
 * mid = (bestBid + bestAsk) / 2
 */
export function calcMid(bestBid: number, bestAsk: number): number {
  return (bestBid + bestAsk) / 2;
}

/**
 * Calculate the absolute spread.
 * spread_abs = bestAsk - bestBid
 */
export function calcSpreadAbs(bestBid: number, bestAsk: number): number {
  return bestAsk - bestBid;
}

/**
 * Calculate the spread in basis points.
 * spread_bps = (spread_abs / mid) * 10000
 */
export function calcSpreadBps(bestBid: number, bestAsk: number): number {
  const mid = calcMid(bestBid, bestAsk);
  if (mid === 0) return 0;
  const spreadAbs = calcSpreadAbs(bestBid, bestAsk);
  return (spreadAbs / mid) * 10_000;
}

/**
 * Calculate the microprice (size-weighted mid price).
 * microprice = (bestBid * askSize + bestAsk * bidSize) / (bidSize + askSize)
 *
 * The microprice weights each side by the OTHER side's size,
 * reflecting the intuition that a larger bid queue pushes the
 * fair price closer to the ask.
 */
export function calcMicroprice(
  bestBid: number,
  bestAsk: number,
  bidSize: number,
  askSize: number
): number {
  const totalSize = bidSize + askSize;
  if (totalSize === 0) return calcMid(bestBid, bestAsk);
  return (bestBid * askSize + bestAsk * bidSize) / totalSize;
}
