import React from 'react';
import { User } from '../types';
import { 
  Key, 
  Database, 
  PlusCircle, 
  LogOut, 
  UserCheck, 
  LayoutDashboard, 
  Ticket as TicketIcon 
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenCreateTicket: () => void;
  onOpenJwtInspector: () => void;
  onOpenFastApiMysql: () => void;
  onQuickSwitchUser: (email: string) => void;
  activeTab: 'tickets' | 'stats';
  setActiveTab: (tab: 'tickets' | 'stats') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenCreateTicket,
  onOpenJwtInspector,
  onOpenFastApiMysql,
  onQuickSwitchUser,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
            IT
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">HelpDesk</span>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'tickets'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Zgłoszenia
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {currentUser && (
            <button
              onClick={onOpenCreateTicket}
              title="Nowe zgłoszenie"
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenFastApiMysql}
            title="FastAPI & MySQL Spec"
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Database className="w-4 h-4" />
          </button>

          {currentUser && (
            <button
              onClick={onOpenJwtInspector}
              title="Inspektor tokenu JWT"
              className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>
          )}

          {currentUser && (
            <div className="relative group">
              <button
                title="Szybkie przełączanie profilu demo"
                className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-52 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Role Demo
                </div>
                <button
                  onClick={() => onQuickSwitchUser('admin@helpdesk.it')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Tomasz (Admin)</span>
                  <span className="text-[9px] px-1 py-0.5 bg-red-100 text-red-700 font-bold rounded">ADMIN</span>
                </button>
                <button
                  onClick={() => onQuickSwitchUser('agent@helpdesk.it')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Anna (Agent IT)</span>
                  <span className="text-[9px] px-1 py-0.5 bg-blue-100 text-blue-700 font-bold rounded">AGENT</span>
                </button>
                <button
                  onClick={() => onQuickSwitchUser('user@firma.pl')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Jan (Pracownik)</span>
                  <span className="text-[9px] px-1 py-0.5 bg-slate-100 text-slate-700 font-bold rounded">USER</span>
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
