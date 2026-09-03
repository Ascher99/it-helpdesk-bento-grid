import React, { useState } from 'react';
import { TicketCategory, TicketPriority } from '../types';
import { api } from '../services/api';
import { priorityConfig, categoryConfig } from '../utils/formatters';
import { X, PlusCircle, AlertCircle, Clock } from 'lucide-react';

interface CreateTicketModalProps {
  onClose: () => void;
  onTicketCreated: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  onClose,
  onTicketCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('HARDWARE');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Tytuł oraz szczegółowy opis problemu są wymagane');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });
      onTicketCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd podczas tworzenia zgłoszenia');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPriorityInfo = priorityConfig[priority];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">Nowe zgłoszenie serwisowe IT</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Temat zgłoszenia <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-create-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Brak łączności z drukarką sieciową na 2. piętrze"
              className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategoria problemu <span className="text-rose-500">*</span>
              </label>
              <select
                id="ticket-create-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {Object.entries(categoryConfig).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priorytet (Wpływ na biznes) <span className="text-rose-500">*</span>
              </label>
              <select
                id="ticket-create-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                <option value="CRITICAL">Krytyczny (Blokada całego działu)</option>
                <option value="HIGH">Wysoki (Brak możliwości pracy)</option>
                <option value="MEDIUM">Średni (Utrudnienie, obejście)</option>
                <option value="LOW">Niski (Drobna prośba / zmiana)</option>
              </select>
            </div>
          </div>

          {/* SLA Expectation Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gwarantowany czas rozwiązania (SLA):</span>
            </span>
            <span className="font-semibold text-slate-900">
              do {currentPriorityInfo.slaHours} godzin roboczych
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dokładny opis problemu lub wniosku <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ticket-create-description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opisz kroki do odtworzenia problemu, treść komunikatów o błędach, model sprzętu lub nazwę aplikacji..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Tworzenie...' : 'Utwórz zgłoszenie'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
