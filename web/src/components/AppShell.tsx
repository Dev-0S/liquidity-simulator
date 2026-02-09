import { NavLink, Outlet } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import { ConnectionStatus as ConnectionStatusType } from '../lib/types';

interface Props {
  connectionStatus: ConnectionStatusType;
}

const NAV_LINKS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/book', label: 'Book', end: false },
  { to: '/impact', label: 'Impact', end: false },
  { to: '/compare', label: 'Compare', end: false },
];

export default function AppShell({ connectionStatus }: Props) {
  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col">
      {/* Top accent line */}
      <div
        className="h-[2px] w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #8b5cf6 70%, transparent 100%)',
        }}
      />

      {/* Top navbar */}
      <nav className="border-b border-border bg-panel/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-[1440px] mx-auto px-4 h-12 flex items-center justify-between">
          {/* Left: brand */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-baseline gap-1.5 group">
              <span className="text-sm font-bold tracking-tight text-accent glow-blue font-sans">
                LIQUIDITY
              </span>
              <span className="text-sm font-medium tracking-tight text-muted font-sans">
                SIMULATOR
              </span>
            </NavLink>

            {/* Center: nav links as pill tabs */}
            <div className="flex items-center gap-1 bg-surface/50 rounded-lg p-0.5">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `px-3.5 py-1.5 text-xs font-medium rounded-md transition-all font-sans ${
                      isActive
                        ? 'bg-accent/10 text-accent shadow-glow-blue'
                        : 'text-muted hover:text-text-primary'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right: connection status */}
          <ConnectionStatus status={connectionStatus} />
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
