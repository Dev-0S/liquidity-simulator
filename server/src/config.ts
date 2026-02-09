import { PairConfig } from './types';

export const SUPPORTED_PAIRS: PairConfig[] = [
  {
    symbol: 'SOLUSDT',
    displayName: 'SOL/USDT',
    venue: 'binance',
    binanceSymbol: 'solusdt',
  },
  {
    symbol: 'BTCUSDT',
    displayName: 'BTC/USDT',
    venue: 'binance',
    binanceSymbol: 'btcusdt',
  },
  {
    symbol: 'ETHUSDT',
    displayName: 'ETH/USDT',
    venue: 'binance',
    binanceSymbol: 'ethusdt',
  },
  {
    symbol: 'SOLUSDC',
    displayName: 'SOL/USDC',
    venue: 'openbook',
    openbookMarket: '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6',
  },
];

export const PORT: number = parseInt(process.env.PORT || '3001', 10);

export const SOLANA_RPC_URL: string =
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
