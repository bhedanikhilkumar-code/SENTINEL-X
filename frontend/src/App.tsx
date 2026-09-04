import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';

// Layout
import { Navbar } from './components/Layout/Navbar';
import { Sidebar } from './components/Layout/Sidebar';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasePage } from './pages/CasePage';
import { AuditPage } from './pages/AuditPage';
import { SpecterWorkbenchPage } from './pages/SpecterWorkbenchPage';
import { DossierExportPage } from './pages/DossierExportPage';

// Specialized Analysis Views
import { StyleRadar } from './components/Stylometry/StyleRadar';
import { TimezoneHistogram } from './components/Stylometry/TimezoneHistogram';
import { StyleCompare } from './components/Stylometry/StyleCompare';
import { WalletHopChain } from './components/Evidence/WalletHopChain';
import { TorCircuitViz } from './components/Evidence/TorCircuitViz';
import { EvidenceLocker } from './components/Evidence/EvidenceLocker';
import { GeoMap } from './components/Map/GeoMap';
import { AttributionTimeline } from './components/Timeline/AttributionTimeline';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const MainLayout: React.FC = () => {
  const { activeCaseId, selectedCaseId } = useStore();

  // Initialize global real-time notification socket
  useWebSocket(activeCaseId || undefined);

  // CHECK 22: React Query cache invalidation on case change
  useEffect(() => {
    queryClient.invalidateQueries();
  }, [activeCaseId, selectedCaseId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#0b0f19] relative flex flex-col min-h-0">
          <Routes>
            {/* CHECK 13: All routes defined in App.tsx react-router-dom */}
            <Route path="/" element={<Navigate to="/graph" replace />} />
            
            {/* IMAGE 1: SPECTER-TRACE Knowledge Graph View */}
            <Route path="/graph" element={<SpecterWorkbenchPage />} />
            
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cases" element={<CasePage />} />
            
            <Route
              path="/stylometry"
              element={
                <div className="p-8 space-y-8 max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                      Stylometric & Linguistic Forensics (Module C)
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      SBERT 384-dimensional vector embeddings, Jensen-Shannon divergence, n-gram lexical analysis, and diurnal posting timestamps.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StyleRadar />
                    <TimezoneHistogram />
                  </div>

                  <StyleCompare />
                </div>
              }
            />

            <Route
              path="/crypto"
              element={
                <div className="p-8 space-y-8 max-w-7xl mx-auto">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                      Cryptocurrency Flow & Multi-Hop Blockchain Tracer (Module D)
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Autonomous UTXO peel-chain unraveling, CoinJoin mixer taint analysis, and KYC exchange deposit clustering.
                    </p>
                  </div>

                  <WalletHopChain />
                  <TorCircuitViz />
                  <EvidenceLocker />
                </div>
              }
            />
            <Route path="/blockchain" element={<Navigate to="/crypto" replace />} />

            <Route
              path="/map"
              element={
                <div className="p-6 h-full flex flex-col gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">
                      Geospatial & Threat Actor Infrastructure Map
                    </h1>
                    <p className="text-xs text-slate-400">
                      Correlating inferred timezone peaks (UTC+05:30), clearnet IP clusters, telecom ASNs, and server nodes.
                    </p>
                  </div>
                  <div className="flex-1 min-h-[650px] bg-slate-900/40 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-2xl">
                    <GeoMap />
                  </div>
                </div>
              }
            />

            <Route
              path="/timeline"
              element={
                <div className="p-8 max-w-6xl mx-auto space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-white tracking-wide">
                      De-Anonymization Chronology & Event Reconstruction
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Unified temporal mapping linking forum posts, BTC ransomware extortion transactions, and clearnet footprint events.
                    </p>
                  </div>
                  <AttributionTimeline />
                </div>
              }
            />

            <Route path="/audit" element={<AuditPage />} />

            {/* IMAGE 2: SENTINEL-X Dossier Export Page */}
            <Route path="/dossier" element={<DossierExportPage />} />

            <Route path="*" element={<Navigate to="/graph" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, setUser } = useStore();

  useEffect(() => {
    // Check localStorage for persisted session
    const savedToken = localStorage.getItem('sentinel_token') || localStorage.getItem('token');
    const savedUser = localStorage.getItem('sentinel_user');
    if (savedToken && savedUser && !user) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
      }
    }
  }, [user, setUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* CHECK 23: Toast notifications for user feedback and error visibility */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0b1329',
              color: '#f8fafc',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              fontFamily: 'monospace',
              fontSize: '12px',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.25)',
            },
          }}
        />
        {!user ? <LoginPage /> : <MainLayout />}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
