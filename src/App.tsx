import React, { useState, useEffect, useCallback } from 'react';
import { User, Ticket, StatsData, TicketFilterState } from './types';
import { api, authStorage } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TicketList } from './components/TicketList';
import { TicketDetailModal } from './components/TicketDetailModal';
import { CreateTicketModal } from './components/CreateTicketModal';
import { StatsDashboard } from './components/StatsDashboard';
import { JwtInspectorModal } from './components/JwtInspectorModal';
import { FastApiMysqlModal } from './components/FastApiMysqlModal';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // View tabs: 'stats' (Dashboard) | 'tickets' (Active Tickets)
  const [activeTab, setActiveTab] = useState<'tickets' | 'stats'>('tickets');

  // Data states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Filters
  const [filters, setFilters] = useState<TicketFilterState>({
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    search: '',
    scope: 'all',
  });

  // Modals
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJwtModalOpen, setIsJwtModalOpen] = useState(false);
  const [isFastApiMysqlOpen, setIsFastApiMysqlOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Initial Auth Check: try stored token, or auto-login default demo admin for instant live app
  const initializeAuth = async () => {
    try {
      setIsInitializing(true);
      const token = authStorage.getToken();
      if (token) {
        const user = await api.getMe();
        setCurrentUser(user);
      } else {
        // Auto-login with Demo Admin to show working app instantly
        const res = await api.login('admin@helpdesk.it', 'Password123!');
        setCurrentUser(res.user);
      }
    } catch {
      try {
        const res = await api.login('admin@helpdesk.it', 'Password123!');
        setCurrentUser(res.user);
      } catch {
        setIsAuthModalOpen(true);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoadingTickets(true);
      const data = await api.getTickets(filters);
      setTickets(data);
    } catch (err: any) {
      showToast(err.message || 'Błąd podczas pobierania zgłoszeń', 'error');
    } finally {
      setIsLoadingTickets(false);
    }
  }, [currentUser, filters]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoadingStats(true);
      const data = await api.getStats();
      setStats(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingStats(false);
    }
  }, [currentUser]);

  // Fetch Users for assignment
  const fetchUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getUsers();
      setUsersList(data);
    } catch {
      // ignore
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      fetchStats();
      fetchUsers();
    }
  }, [currentUser, fetchTickets, fetchStats, fetchUsers]);

  // Logout Handler
  const handleLogout = () => {
    authStorage.removeToken();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
    showToast('Wylogowano z systemu IT Helpdesk');
  };

  // Quick Switch User
  const handleQuickSwitchUser = async (email: string) => {
    try {
      const res = await api.login(email, 'Password123!');
      setCurrentUser(res.user);
      showToast(`Przełączono profil na: ${res.user.full_name} (${res.user.role})`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans">
        <div className="text-center space-y-3 bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm max-w-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">Uruchamianie IT Helpdesk Bento Grid...</h2>
          <p className="text-xs text-slate-500">Inicjalizacja uwierzytelniania JWT i relacyjnego backendu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col lg:flex-row font-sans antialiased overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Top Navigation Header */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenCreateTicket={() => setIsCreateModalOpen(true)}
        onOpenJwtInspector={() => setIsJwtModalOpen(true)}
        onOpenFastApiMysql={() => setIsFastApiMysqlOpen(true)}
        onQuickSwitchUser={handleQuickSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:block">
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCreateTicket={() => setIsCreateModalOpen(true)}
          onOpenJwtInspector={() => setIsJwtModalOpen(true)}
          onOpenFastApiMysql={() => setIsFastApiMysqlOpen(true)}
          onQuickSwitchUser={handleQuickSwitchUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* System Overview Header matching Bento Grid Design HTML */}
        <header className="px-6 md:px-8 pt-6 pb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              System Overview
            </h2>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">
              Real-time ticketing metrics and stack health (FastAPI & MySQL)
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-2xl border-2 border-slate-200 shadow-2xs self-start sm:self-auto">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Server Latency
              </span>
              <span className="text-base font-mono text-emerald-600 font-bold">14ms</span>
            </div>
            <div className="w-[1px] bg-slate-200 h-8" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                MySQL Pool
              </span>
              <span className="text-base font-mono text-indigo-600 font-bold">8/20</span>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 px-6 md:px-8 py-4">
          {currentUser ? (
            <div>
              {activeTab === 'tickets' ? (
                <TicketList
                  tickets={tickets}
                  currentUser={currentUser}
                  filters={filters}
                  setFilters={setFilters}
                  onSelectTicket={(t) => setSelectedTicketId(t.id)}
                  onRefresh={() => {
                    fetchTickets();
                    fetchStats();
                    showToast('Zaktualizowano listę zgłoszeń');
                  }}
                  isLoading={isLoadingTickets}
                />
              ) : (
                <StatsDashboard 
                  stats={stats} 
                  isLoading={isLoadingStats} 
                  onOpenCreateTicket={() => setIsCreateModalOpen(true)}
                  onOpenFastApiMysql={() => setIsFastApiMysqlOpen(true)}
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Wymagane zalogowanie</h3>
              <p className="text-xs text-slate-500 mb-6">
                Aby uzyskać dostęp do zgłoszeń serwisowych, zaloguj się do systemu tokenem JWT.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 transition-all cursor-pointer"
              >
                Przejdź do logowania
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedTicketId !== null && currentUser && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={() => {
            fetchTickets();
            fetchStats();
          }}
          usersList={usersList}
        />
      )}

      {isCreateModalOpen && (
        <CreateTicketModal
          onClose={() => setIsCreateModalOpen(false)}
          onTicketCreated={() => {
            fetchTickets();
            fetchStats();
            showToast('Pomyślnie zarejestrowano nowe zgłoszenie IT');
          }}
        />
      )}

      {isJwtModalOpen && (
        <JwtInspectorModal onClose={() => setIsJwtModalOpen(false)} />
      )}

      {isFastApiMysqlOpen && (
        <FastApiMysqlModal onClose={() => setIsFastApiMysqlOpen(false)} />
      )}

      {isAuthModalOpen && (
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthModalOpen(false);
            showToast(`Zalogowano pomyślnie jako: ${user.full_name}`);
          }}
        />
      )}
    </div>
  );
}
