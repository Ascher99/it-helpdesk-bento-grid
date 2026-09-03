import React from 'react';
import { Ticket, TicketFilterState, User } from '../types';
import { 
  priorityConfig, 
  statusConfig, 
  categoryConfig, 
  formatDateTime, 
  formatTimeRemaining 
} from '../utils/formatters';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Tag
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  currentUser: User;
  filters: TicketFilterState;
  setFilters: React.Dispatch<React.SetStateAction<TicketFilterState>>;
  onSelectTicket: (ticket: Ticket) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  currentUser,
  filters,
  setFilters,
  onSelectTicket,
  onRefresh,
  isLoading,
}) => {
  const statusTabs = [
    { key: 'ALL', label: 'Wszystkie' },
    { key: 'NEW', label: 'Nowe' },
    { key: 'OPEN', label: 'Otwarte' },
    { key: 'IN_PROGRESS', label: 'W toku' },
    { key: 'WAITING', label: 'Oczekujące' },
    { key: 'RESOLVED', label: 'Rozwiązane' },
    { key: 'CLOSED', label: 'Zamknięte' },
  ];

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tickets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['Numer', 'Tytul', 'Kategoria', 'Priorytet', 'Status', 'Zglaszajacy', 'Dzial', 'Przypisany', 'Termin_SLA', 'Data_Utworzenia'];
    const rows = tickets.map((t) => [
      `"${t.ticket_number}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${categoryConfig[t.category]?.label || t.category}"`,
      `"${priorityConfig[t.priority]?.label || t.priority}"`,
      `"${statusConfig[t.status]?.label || t.status}"`,
      `"${t.reporter_name}"`,
      `"${t.reporter_department}"`,
      `"${t.assigned_agent_name || 'Nieprzypisany'}"`,
      `"${t.sla_deadline}"`,
      `"${t.created_at}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getPriorityLetter = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'K';
      case 'HIGH':
        return 'H';
      case 'MEDIUM':
        return 'M';
      case 'LOW':
        return 'L';
      default:
        return 'T';
    }
  };

  const getPriorityAvatarClass = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-100 text-rose-600 border border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-600 border border-amber-200';
      case 'LOW':
        return 'bg-blue-100 text-blue-600 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Bento Controls & Filter Tile */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Aktywne zgłoszenia
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Zarządzanie incydentami, zapytaniami serwisowymi i zgłoszeniami użytkowników
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              title="Pobierz tabelę zgłoszeń CSV"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-full transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              title="Pobierz dane JSON"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-full transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Odśwież zgłoszenia"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-full transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Odśwież</span>
            </button>
          </div>
        </div>

        {/* Search & Select Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="ticket-search-input"
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Szukaj po tytule, opisie, numerze (#IT-...) lub nazwisku..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category selector */}
          <div className="md:col-span-3">
            <select
              id="filter-category-select"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Wszystkie kategorie</option>
              <option value="HARDWARE">Sprzęt & Akcesoria</option>
              <option value="SOFTWARE">Oprogramowanie & Licencje</option>
              <option value="NETWORK">Sieć & VPN</option>
              <option value="ACCESS">Uprawnienia & Konta</option>
              <option value="SECURITY">Bezpieczeństwo</option>
              <option value="OTHER">Inne zgłoszenia</option>
            </select>
          </div>

          {/* Priority selector */}
          <div className="md:col-span-2">
            <select
              id="filter-priority-select"
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Wszystkie priorytety</option>
              <option value="CRITICAL">Krytyczny (4h)</option>
              <option value="HIGH">Wysoki (8h)</option>
              <option value="MEDIUM">Średni (24h)</option>
              <option value="LOW">Niski (72h)</option>
            </select>
          </div>

          {/* Scope Toggle for Staff */}
          {(currentUser.role === 'AGENT' || currentUser.role === 'ADMIN') && (
            <div className="md:col-span-2">
              <button
                id="btn-toggle-scope"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    scope: prev.scope === 'my_assigned' ? 'all' : 'my_assigned',
                  }))
                }
                className={`w-full text-xs px-3 py-2.5 rounded-2xl font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  filters.scope === 'my_assigned'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="truncate">{filters.scope === 'my_assigned' ? 'Moje zgłoszenia' : 'Wszystkie działy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => {
            const isSelected = filters.status === tab.key;
            return (
              <button
                key={tab.key}
                id={`status-tab-${tab.key.toLowerCase()}`}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.key }))}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List View */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Brak zgłoszeń spełniających kryteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Zmień filtry wyszukiwania lub wyczyść kryteria, aby zobaczyć pozostałe sprawy.
          </p>
          <button
            onClick={() =>
              setFilters({
                status: 'ALL',
                priority: 'ALL',
                category: 'ALL',
                search: '',
                scope: 'all',
              })
            }
            className="text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Wyczyść wszystkie filtry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
            const statusInfo = statusConfig[ticket.status] || statusConfig.OPEN;
            const categoryInfo = categoryConfig[ticket.category] || categoryConfig.OTHER;
            const slaInfo = formatTimeRemaining(ticket.sla_deadline, ticket.status);
            const priorityLetter = getPriorityLetter(ticket.priority);
            const avatarClass = getPriorityAvatarClass(ticket.priority);

            return (
              <div
                key={ticket.id}
                id={`ticket-card-${ticket.id}`}
                onClick={() => onSelectTicket(ticket)}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group shadow-2xs"
              >
                {/* Letter Avatar Box matching Bento Design HTML */}
                <div 
                  title={`Priorytet: ${priorityInfo.label}`}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${avatarClass}`}
                >
                  {priorityLetter}
                </div>

                {/* Ticket Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {ticket.ticket_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {categoryInfo.label}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400 truncate">
                      {ticket.reporter_name} ({ticket.reporter_department})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {ticket.title}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ticket.description}
                  </p>
                </div>

                {/* Right badges: SLA & Status pill */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* SLA clock indicator */}
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${slaInfo.badgeClass}`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{slaInfo.text}</span>
                  </span>

                  {/* Comments count */}
                  {(ticket.comments_count ?? 0) > 0 && (
                    <span className="flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-full text-xs font-semibold">
                      <MessageSquare className="w-3 h-3 text-slate-400" />
                      <span>{ticket.comments_count}</span>
                    </span>
                  )}

                  {/* Status Pill matching Bento Design HTML */}
                  <div className="px-3.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-700 uppercase tracking-wider shadow-2xs">
                    {statusInfo.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
