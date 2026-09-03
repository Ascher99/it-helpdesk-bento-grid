import React from 'react';
import { User } from '../types';
import { 
  Database, 
  Key, 
  PlusCircle, 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  UserCheck, 
  LogOut,
  ShieldAlert,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentUser: User | null;
  activeTab: 'tickets' | 'stats';
  setActiveTab: (tab: 'tickets' | 'stats') => void;
  onOpenCreateTicket: () => void;
  onOpenJwtInspector: () => void;
  onOpenFastApiMysql: () => void;
  onQuickSwitchUser: (email: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenCreateTicket,
  onOpenJwtInspector,
  onOpenFastApiMysql,
  onQuickSwitchUser,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col p-6 h-screen sticky top-0 shrink-0 select-none shadow-xs z-20">
      {/* Brand Logo & Name matching Design HTML */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
          IT
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">HelpDesk</h1>
          <p className="text-[10px] text-slate-400 font-mono font-medium">Bento Grid System</p>
        </div>
      </div>

      {/* Main Navigation matching Design HTML pills */}
      <nav className="space-y-2">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('stats')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-xs transition-all cursor-pointer text-left ${
            activeTab === 'stats'
              ? 'bg-indigo-50 text-indigo-700 shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeTab === 'stats' ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          />
          <span>Dashboard & Metryki</span>
        </button>

        {/* Active Tickets Tab */}
        <button
          onClick={() => setActiveTab('tickets')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-xs transition-all cursor-pointer text-left ${
            activeTab === 'tickets'
              ? 'bg-indigo-50 text-indigo-700 shadow-xs'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeTab === 'tickets' ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          />
          <span>Aktywne Zgłoszenia</span>
        </button>

        {/* Create Ticket Action */}
        {currentUser && (
          <button
            onClick={onOpenCreateTicket}
            className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nowe zgłoszenie</span>
          </button>
        )}
      </nav>

      {/* Developer & Stack Tools */}
      <div className="mt-8 pt-6 border-t border-slate-100 space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
          Architektura IT
        </div>

        <button
          onClick={onOpenFastApiMysql}
          title="Zobacz schemat MySQL i kod FastAPI"
          className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
        >
          <Database className="w-4 h-4 text-slate-400" />
          <span>FastAPI & MySQL Spec</span>
        </button>

        {currentUser && (
          <button
            onClick={onOpenJwtInspector}
            title="Inspektor i dekoder tokenu JWT"
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer text-left"
          >
            <Key className="w-4 h-4 text-indigo-500" />
            <span>Token JWT Inspektor</span>
          </button>
        )}
      </div>

      {/* Auth Session Bottom Card matching Design HTML */}
      {currentUser && (
        <div className="mt-auto p-4 bg-slate-900 rounded-2xl text-white shadow-xl">
          <div className="text-[10px] text-indigo-300 uppercase font-bold mb-1 tracking-wider">
            Auth Session
          </div>
          <div className="text-xs font-bold text-white truncate">
            {currentUser.email}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {currentUser.full_name}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <div className="px-2 py-0.5 bg-indigo-500 rounded text-[10px] uppercase font-bold text-white tracking-wider">
              JWT Active
            </div>

            <div className="flex items-center space-x-1">
              {/* Quick switch user dropdown */}
              <div className="relative group">
                <button
                  title="Przełącz konto demo (Admin, Agent, User)"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </button>
                <div className="absolute left-0 bottom-full mb-2 w-52 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Szybkie role demo
                  </div>
                  <button
                    onClick={() => onQuickSwitchUser('admin@helpdesk.it')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Tomasz (Admin)</span>
                    <span className="text-[9px] px-1 py-0.5 bg-red-100 text-red-700 font-bold rounded">ADMIN</span>
                  </button>
                  <button
                    onClick={() => onQuickSwitchUser('agent@helpdesk.it')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Anna (Agent IT)</span>
                    <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 font-bold rounded">AGENT</span>
                  </button>
                  <button
                    onClick={() => onQuickSwitchUser('user@firma.pl')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <span>Jan (Pracownik)</span>
                    <span className="text-[9px] px-1 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">USER</span>
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Wyloguj z systemu"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
