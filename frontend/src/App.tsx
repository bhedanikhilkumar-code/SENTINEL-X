import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

// Specialized Analysis Views
import { KnowledgeGraph } from './components/Graph/KnowledgeGraph';
import { StyleRadar } from './components/Stylometry/StyleRadar';
import { TimezoneHistogram } from './components/Stylometry/TimezoneHistogram';
import { StyleCompare } from './components/Stylometry/StyleCompare';
import { WalletHopChain } from './components/Evidence/WalletHopChain';
import { TorCircuitViz } from './components/Evidence/TorCircuitViz';
import { EvidenceLocker } from './components/Evidence/EvidenceLocker';
import { GeoMap } from './components/Map/GeoMap';
import { AttributionTimeline } from './components/Timeline/AttributionTimeline';
import { DossierExport } from './components/PDF/DossierExport';
import { ConfidenceBreakdown } from './components/Confidence/ConfidenceBreakdown';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const MainLayout: React.FC = () => {
  const { currentView, activeCaseId } = useStore();

  // Initialize global real-time notification socket
  useWebSocket(activeCaseId || undefined);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-[#0b0f19] relative">
          {currentView === 'dashboard' && <DashboardPage />}

          {currentView === 'cases' && <CasePage />}

          {currentView === 'graph' && (
            <div className="p-6 h-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">
                    Knowledge Graph Exploration (Neo4j Engine)
                  </h1>
                  <p className="text-xs text-slate-400">
                    Interactive link analysis connecting Dark Web aliases, Bitcoin addresses, PGP keys, and clearnet identities.
                  </p>
                </div>
                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono rounded-full">
                  Case ID: #{activeCaseId || 1}
                </span>
              </div>
              <div className="flex-1 min-h-[650px] bg-slate-900/40 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-2xl">
                <KnowledgeGraph caseId={activeCaseId || 1} />
              </div>
            </div>
          )}

          {currentView === 'stylometry' && (
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
          )}

          {currentView === 'blockchain' && (
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  Cryptocurrency Flow & Multi-Hop Blockchain Tracer
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Autonomous UTXO peel-chain unraveling, CoinJoin mixer taint analysis, and KYC exchange deposit clustering.
                </p>
              </div>

              <WalletHopChain />
              <TorCircuitViz />
              <EvidenceLocker />
            </div>
          )}

          {currentView === 'map' && (
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
          )}

          {currentView === 'timeline' && (
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
          )}

          {currentView === 'audit' && <AuditPage />}

          {currentView === 'dossier' && (
            <div className="p-8 max-w-6xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wide">
                  Court-Admissible Dossier Export Engine
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Generate 6-page comprehensive intelligence dossier formatted per NTRO SIH26151 guidelines and Indian Evidence Act § 65B.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <DossierExport />
                </div>
                <div>
                  <ConfidenceBreakdown />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, setUser } = useStore();

  useEffect(() => {
    // Check localStorage for persisted session
    const savedToken = localStorage.getItem('sentinel_token');
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
      {!user ? <LoginPage /> : <MainLayout />}
    </QueryClientProvider>
  );
};

export default App;
