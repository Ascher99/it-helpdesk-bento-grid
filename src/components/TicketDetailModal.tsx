import React, { useState, useEffect } from 'react';
import { Ticket, User, TicketPriority, TicketStatus, TicketCategory } from '../types';
import { api } from '../services/api';
import { 
  priorityConfig, 
  statusConfig, 
  categoryConfig, 
  formatDateTime, 
  formatTimeRemaining 
} from '../utils/formatters';
import { 
  X, 
  Clock, 
  Send, 
  Lock, 
  UserCheck, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  History, 
  MessageSquare,
  Building,
  Mail
} from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: number;
  currentUser: User;
  onClose: () => void;
  onTicketUpdated: () => void;
  usersList: User[];
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticketId,
  currentUser,
  onClose,
  onTicketUpdated,
  usersList,
}) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussion' | 'audit'>('discussion');
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAgentOrAdmin = currentUser.role === 'AGENT' || currentUser.role === 'ADMIN';

  const loadTicketData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await api.getTicketById(ticketId);
      setTicket(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Błąd podczas pobierania szczegółów zgłoszenia');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [ticketId]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setIsUpdatingStatus(true);
      await api.updateTicket(ticket.id, { status: newStatus });
      await loadTicketData();
      onTicketUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    try {
      await api.updateTicket(ticket.id, { priority: newPriority });
      await loadTicketData();
      onTicketUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCategoryChange = async (newCategory: TicketCategory) => {
    if (!ticket) return;
    try {
      await api.updateTicket(ticket.id, { category: newCategory });
      await loadTicketData();
      onTicketUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAssigneeChange = async (agentId: number | null) => {
    if (!ticket) return;
    try {
      await api.updateTicket(ticket.id, { assigned_agent_id: agentId });
      await loadTicketData();
      onTicketUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.addComment(ticket.id, newComment.trim(), isInternalNote);
      setNewComment('');
      setIsInternalNote(false);
      await loadTicketData();
      onTicketUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć zgłoszenie ${ticket.ticket_number}?`)) return;
    try {
      await api.deleteTicket(ticket.id);
      onTicketUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (isLoading || !ticket) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Ładowanie szczegółów zgłoszenia...</p>
        </div>
      </div>
    );
  }

  const priorityInfo = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;
  const statusInfo = statusConfig[ticket.status] || statusConfig.OPEN;
  const categoryInfo = categoryConfig[ticket.category] || categoryConfig.OTHER;
  const slaInfo = formatTimeRemaining(ticket.sla_deadline, ticket.status);
  const potentialAgents = usersList.filter((u) => u.role === 'AGENT' || u.role === 'ADMIN');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold bg-slate-800 text-indigo-300 px-2.5 py-1 rounded border border-slate-700">
              {ticket.ticket_number}
            </span>
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400">Utworzono: {formatDateTime(ticket.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={handleDeleteTicket}
                title="Usuń zgłoszenie (Admin)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message banner if any */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title and Top Metas */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Status Badge */}
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                <span>{statusInfo.label}</span>
              </span>

              {/* Priority Badge */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${priorityInfo.badgeClass}`}>
                {priorityInfo.label}
              </span>

              {/* Category Badge */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {categoryInfo.label}
              </span>

              {/* SLA badge */}
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs border ${slaInfo.badgeClass}`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{slaInfo.text}</span>
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-snug">{ticket.title}</h2>
          </div>

          {/* Quick Operations Bar (For Agents & Admins) */}
          {isAgentOrAdmin && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Panel Zarządzania Zgłoszeniem (Helpdesk Workflow)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Status Switcher */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status zgłoszenia</label>
                  <select
                    value={ticket.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="NEW">Nowe</option>
                    <option value="OPEN">Otwarte (Przyjęte)</option>
                    <option value="IN_PROGRESS">W trakcie realizacji</option>
                    <option value="WAITING">Oczekuje na odpowiedź</option>
                    <option value="RESOLVED">Rozwiązane</option>
                    <option value="CLOSED">Zamknięte</option>
                  </select>
                </div>

                {/* Priority Switcher */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Priorytet & SLA</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="CRITICAL">Krytyczny (SLA 4h)</option>
                    <option value="HIGH">Wysoki (SLA 8h)</option>
                    <option value="MEDIUM">Średni (SLA 24h)</option>
                    <option value="LOW">Niski (SLA 72h)</option>
                  </select>
                </div>

                {/* Assignee Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Przypisany Informatyk / Agent</label>
                  <select
                    value={ticket.assigned_agent_id ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      handleAssigneeChange(val);
                    }}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Nieprzypisany</option>
                    {potentialAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* If user is the reporter, quick button to close ticket */}
          {!isAgentOrAdmin && ticket.status !== 'CLOSED' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-600">Czy problem został rozwiązany?</span>
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Potwierdź i zamknij sprawę</span>
              </button>
            </div>
          )}

          {/* Description & Reporter Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Main Description */}
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Opis problemu</h3>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Reporter & SLA Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dane zgłoszenia</h3>
              
              <div className="space-y-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Zgłaszający:</span>
                  <span className="font-semibold text-slate-800">{ticket.reporter_name}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-700">{ticket.reporter_email}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ticket.reporter_department}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Termin SLA:</span>
                  <span className="font-medium text-slate-700">{formatDateTime(ticket.sla_deadline)}</span>
                </div>

                {ticket.resolved_at && (
                  <div>
                    <span className="text-slate-400 block text-[11px]">Rozwiązano:</span>
                    <span className="font-medium text-emerald-700">{formatDateTime(ticket.resolved_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs: Comments & Audit Log */}
          <div>
            <div className="flex border-b border-slate-200 mb-4">
              <button
                onClick={() => setActiveTab('discussion')}
                className={`pb-2 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'discussion'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Dyskusja & Notatki ({ticket.comments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-2 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'audit'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Dziennik audytu ({ticket.audit_logs?.length || 0})</span>
              </button>
            </div>

            {/* Tab 1: Discussion Thread */}
            {activeTab === 'discussion' && (
              <div className="space-y-4">
                {/* List of Comments */}
                {ticket.comments && ticket.comments.length > 0 ? (
                  <div className="space-y-3">
                    {ticket.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`rounded-xl p-3.5 border transition-all ${
                          comment.is_internal_note
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold">{comment.user_name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase bg-slate-100 text-slate-700">
                              {comment.user_role}
                            </span>
                            {comment.is_internal_note && (
                              <span className="inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-200 text-amber-900">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Notatka wewnętrzna IT</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {comment.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Brak komentarzy w tym zgłoszeniu. Rozpocznij dyskusję poniżej.
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                  <div className="relative">
                    <textarea
                      id="comment-message-input"
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={
                        isInternalNote
                          ? 'Wpisz notatkę techniczną (widoczną wyłącznie dla agentów i administratora)...'
                          : 'Wpisz wiadomość lub odpowiedź dla użytkownika...'
                      }
                      className={`w-full p-3 text-xs rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                        isInternalNote
                          ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-500 text-amber-950'
                          : 'bg-white border-slate-300 focus:ring-indigo-500 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Internal note checkbox (only for Agents and Admins) */}
                    {isAgentOrAdmin ? (
                      <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="flex items-center space-x-1 font-medium">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Notatka wewnętrzna IT (niewidoczna dla pracownika)</span>
                        </span>
                      </label>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Twoja odpowiedź zostanie przesłana do zespołu IT Helpdesk.
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingComment || !newComment.trim()}
                      className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-xs ${
                        isInternalNote
                          ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
                          : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingComment ? 'Wysyłanie...' : 'Wyślij wiadomość'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Audit Trail */}
            {activeTab === 'audit' && (
              <div className="space-y-2">
                {ticket.audit_logs && ticket.audit_logs.length > 0 ? (
                  <div className="overflow-hidden border border-slate-200 rounded-xl">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 text-left">Data</th>
                          <th className="py-2.5 px-3 text-left">Użytkownik</th>
                          <th className="py-2.5 px-3 text-left">Operacja</th>
                          <th className="py-2.5 px-3 text-left">Poprzednia wartość</th>
                          <th className="py-2.5 px-3 text-left">Nowa wartość</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {ticket.audit_logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                              {formatDateTime(log.created_at)}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {log.user_name}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">{log.old_value || '—'}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{log.new_value || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Brak zarejestrowanych wpisów audytowych dla tego zgłoszenia.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
