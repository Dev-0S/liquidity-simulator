import { createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import Orderbook from './pages/Orderbook';
import Impact from './pages/Impact';
import Compare from './pages/Compare';
import { useOrderBook, OrderBookState } from './hooks/useOrderBook';
import { Book, Venue } from './lib/types';

// Context to share order book state across all pages
export const OrderBookContext = createContext<OrderBookState>({
  books: {},
  connectionStatus: 'disconnected',
  lastUpdate: 0,
  getBook: (_venue: Venue, _symbol: string): Book | undefined => undefined,
  priceHistory: {},
  getPriceHistory: (_venue: Venue, _symbol: string) => [],
});

function AppInner() {
  const orderBookState = useOrderBook();

  return (
    <OrderBookContext.Provider value={orderBookState}>
      <Routes>
        <Route element={<AppShell connectionStatus={orderBookState.connectionStatus} />}>
          <Route path="/" element={<Landing />} />
          <Route path="/book" element={<Orderbook />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/compare" element={<Compare />} />
        </Route>
      </Routes>
    </OrderBookContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
