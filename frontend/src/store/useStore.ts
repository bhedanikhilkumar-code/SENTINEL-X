import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  role: 'analyst' | 'senior_analyst' | 'soc_lead' | 'auditor';
  display_name: string;
}

export interface AlertMessage {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'HIGH' | 'INFO';
  title: string;
  message: string;
  case_id?: string;
}

interface AppState {
  // Auth state
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;

  // Active navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Active case
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  activeCaseId: string | null;
  setActiveCaseId: (id: string | null) => void;

  // Live SOC alerts feed
  alerts: AlertMessage[];
  addAlert: (alert: Omit<AlertMessage, 'id' | 'timestamp'>) => void;
  clearAlerts: () => void;

  // Global modals
  isAiCopilotOpen: boolean;
  setIsAiCopilotOpen: (open: boolean) => void;
  isIngestOpen: boolean;
  setIsIngestOpen: (open: boolean) => void;
  isSubpoenaOpen: boolean;
  setIsSubpoenaOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('sentinel_user');
      return u ? JSON.parse(u) : { id: 'usr-analyst-01', username: 'priya', role: 'analyst', display_name: 'Priya Patel' };
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('sentinel_token') || 'demo_token',
  setUser: (user, token) => {
    const activeToken = token || localStorage.getItem('sentinel_token') || 'demo_token';
    if (user) {
      localStorage.setItem('sentinel_user', JSON.stringify(user));
      localStorage.setItem('sentinel_token', activeToken);
    } else {
      localStorage.removeItem('sentinel_user');
      localStorage.removeItem('sentinel_token');
    }
    set({ user, token: user ? activeToken : null });
  },
  logout: () => {
    localStorage.removeItem('sentinel_user');
    localStorage.removeItem('sentinel_token');
    set({ user: null, token: null });
  },

  activeTab: 'cases',
  currentView: 'cases',
  setActiveTab: (tab) => set({ activeTab: tab, currentView: tab }),
  setCurrentView: (view) => set({ currentView: view, activeTab: view }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  selectedCaseId: 'case-phantom-krypt-01',
  activeCaseId: 'case-phantom-krypt-01',
  setSelectedCaseId: (id) => set({ selectedCaseId: id, activeCaseId: id }),
  setActiveCaseId: (id) => set({ selectedCaseId: id, activeCaseId: id }),

  alerts: [
    {
      id: 'alt-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'CRITICAL',
      title: 'Attribution Threshold Exceeded',
      message: 'PHANTOM-KRYPT confidence C_total reached 91.2% (De-Cloaked)',
      case_id: 'case-phantom-krypt-01',
    },
    {
      id: 'alt-2',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      level: 'HIGH',
      title: 'Tor Circuit Rotation',
      message: 'Clean circuit acquired via Netherlands Exit Node (194.26.29.112)',
    },
  ],
  addAlert: (alert) =>
    set((state) => ({
      alerts: [
        {
          ...alert,
          id: `alt-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...state.alerts.slice(0, 29),
      ],
    })),
  clearAlerts: () => set({ alerts: [] }),

  isAiCopilotOpen: false,
  setIsAiCopilotOpen: (open) => set({ isAiCopilotOpen: open }),
  isIngestOpen: false,
  setIsIngestOpen: (open) => set({ isIngestOpen: open }),
  isSubpoenaOpen: false,
  setIsSubpoenaOpen: (open) => set({ isSubpoenaOpen: open }),
}));
