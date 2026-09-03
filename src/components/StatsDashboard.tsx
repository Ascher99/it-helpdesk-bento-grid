import React from 'react';
import { StatsData } from '../types';
import { categoryConfig, priorityConfig } from '../utils/formatters';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PieChart, 
  Server,
  ArrowRight
} from 'lucide-react';

interface StatsDashboardProps {
  stats: StatsData | null;
  isLoading: boolean;
  onOpenCreateTicket?: () => void;
  onOpenFastApiMysql?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ 
  stats, 
  isLoading,
  onOpenCreateTicket,
  onOpenFastApiMysql
}) => {
  if (isLoading || !stats) {
    return (
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center shadow-sm">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kalkulacja metryk Bento Grid & SLA Helpdesk...</p>
      </div>
    );
  }

  const capacityRate = stats.total > 0 ? Math.min(100, Math.round(((stats.open + stats.in_progress) / Math.max(stats.total, 1)) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bento Tile 1: Open Tickets (Indigo Signature Tile) */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-indigo-200 min-h-[190px]">
          <div>
            <h3 className="text-indigo-100 font-bold uppercase text-xs tracking-widest mb-1">
              Otwarte zgłoszenia (Open Tickets)
            </h3>
            <div className="text-5xl font-black italic tracking-tighter">
              {stats.open}
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 bg-indigo-400 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-500" 
                style={{ width: `${capacityRate}%` }}
              />
            </div>
            <p className="text-xs font-medium text-indigo-100 flex items-center justify-between">
              <span>W toku realizacji: <strong>{stats.in_progress}</strong></span>
              <span>{capacityRate}% obciążenia</span>
            </p>
          </div>
        </div>

        {/* Bento Tile 2: Resolution Rate & Bar indicators */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between shadow-sm min-h-[190px]">
          <div>
            <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">
              Wskaźnik rozwiązań (SLA Rate)
            </h3>
            <div className="text-3xl font-bold text-slate-800">
              {stats.sla_compliance_rate}%
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex gap-1.5 items-end h-10">
              <div className="flex-1 bg-slate-100 h-1/2 rounded-t" />
              <div className="flex-1 bg-slate-100 h-2/3 rounded-t" />
              <div className="flex-1 bg-slate-200 h-full rounded-t" />
              <div className="flex-1 bg-indigo-400 h-3/4 rounded-t" />
              <div className="flex-1 bg-indigo-500 h-4/5 rounded-t" />
              <div className="flex-1 bg-indigo-600 h-full rounded-t" />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Zamknięte: <strong className="text-slate-800 font-semibold">{stats.resolved}</strong></span>
              <span className="text-[11px] text-emerald-600 font-bold">Cel: &ge;95%</span>
            </div>
          </div>
        </div>

        {/* Bento Tile 3: Emerald Action Button for New Ticket */}
        <div className="bg-emerald-500 rounded-3xl p-6 text-white flex flex-col justify-center items-center gap-2 shadow-lg shadow-emerald-100 min-h-[190px]">
          <div className="text-xs font-bold uppercase tracking-wider opacity-90">
            Nowe zgłoszenie
          </div>
          <button
            onClick={onOpenCreateTicket}
            title="Dodaj nowe zgłoszenie serwisowe"
            className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black hover:scale-105 transition-transform shadow-md cursor-pointer"
          >
            +
          </button>
          <span className="text-[11px] text-emerald-100 font-medium">Kliknij, aby utworzyć wniosek</span>
        </div>
      </div>

      {/* Bento Grid Middle Section: Dark Tech Core + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dark Tech Stack Bento Tile */}
        <div className="lg:col-span-2 bg-[#0F172A] rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">
                FastAPI & MySQL Integration Status
              </h3>
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                <span className="text-xs sm:text-sm font-mono font-bold tracking-wider">
                  REST ENDPOINTS: OPERATIONAL
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-3.5 py-2 bg-slate-800/90 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">DB Queries</div>
                <div className="text-sm font-bold font-mono text-slate-100">14ms / avg</div>
              </div>
              <div className="px-3.5 py-2 bg-slate-800/90 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Uptime Stack</div>
                <div className="text-sm font-bold font-mono text-emerald-400">99.98%</div>
              </div>
              <div className="px-3.5 py-2 bg-slate-800/90 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Przekroczone SLA</div>
                <div className={`text-sm font-bold font-mono ${stats.sla_breached > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {stats.sla_breached} incydentów
                </div>
              </div>
            </div>

            {onOpenFastApiMysql && (
              <button
                onClick={onOpenFastApiMysql}
                className="inline-flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-white font-semibold transition-colors pt-1"
              >
                <span>Zobacz schemat MySQL & kod FastAPI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-slate-800 rounded-full flex items-center justify-center relative shrink-0 self-center sm:self-auto">
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent -rotate-45" />
            <span className="text-xl sm:text-2xl font-black font-mono">v1.0</span>
          </div>
        </div>

        {/* Bento Tile: Total Cases Overview */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Rejestr zgłoszeń IT
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold uppercase">
                Baza aktywna
              </span>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tight mb-1">
              {stats.total}
            </div>
            <p className="text-xs text-slate-500">Wszystkie zarejestrowane sprawy w systemie</p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                W realizacji:
              </span>
              <span className="font-bold text-slate-800">{stats.in_progress}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Rozwiązane:
              </span>
              <span className="font-bold text-slate-800">{stats.resolved}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Przekroczenia SLA:
              </span>
              <span className="font-bold text-rose-600">{stats.sla_breached}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Bottom Section: Distribution Breakdown Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Bento Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <span className="tracking-tight">Zgłoszenia według kategorii problemu</span>
          </h3>

          <div className="space-y-3.5">
            {Object.entries(categoryConfig).map(([catKey, info]) => {
              const count = stats.by_category[catKey] || 0;
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={catKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{info.label}</span>
                    <span className="font-bold text-slate-900">
                      {count} <span className="text-slate-400 font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & SLA Target Breakdown Bento Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="tracking-tight">Rozkład priorytetów & reżim SLA</span>
          </h3>

          <div className="space-y-3.5">
            {Object.entries(priorityConfig).map(([priorityKey, info]) => {
              const count = stats.by_priority[priorityKey] || 0;
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              let barColor = 'bg-slate-400';
              if (priorityKey === 'CRITICAL') barColor = 'bg-rose-600';
              if (priorityKey === 'HIGH') barColor = 'bg-amber-500';
              if (priorityKey === 'MEDIUM') barColor = 'bg-blue-500';

              return (
                <div key={priorityKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {info.label} <span className="text-slate-400 text-[11px]">(SLA max {info.slaHours}h)</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {count} <span className="text-slate-400 font-normal">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
