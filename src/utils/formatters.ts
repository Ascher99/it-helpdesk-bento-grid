import { TicketPriority, TicketStatus, TicketCategory } from '../types';

export const priorityConfig: Record<
  TicketPriority,
  { label: string; badgeClass: string; slaHours: number }
> = {
  CRITICAL: {
    label: 'Krytyczny',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    slaHours: 4,
  },
  HIGH: {
    label: 'Wysoki',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    slaHours: 8,
  },
  MEDIUM: {
    label: 'Średni',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    slaHours: 24,
  },
  LOW: {
    label: 'Niski',
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
    slaHours: 72,
  },
};

export const statusConfig: Record<
  TicketStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  NEW: {
    label: 'Nowe',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  OPEN: {
    label: 'Otwarte',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  IN_PROGRESS: {
    label: 'W realizacji',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  WAITING: {
    label: 'Oczekuje na odpowiedź',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
  },
  RESOLVED: {
    label: 'Rozwiązane',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Zamknięte',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const categoryConfig: Record<
  TicketCategory,
  { label: string; iconName: string }
> = {
  HARDWARE: { label: 'Sprzęt & Akcesoria', iconName: 'Laptop' },
  SOFTWARE: { label: 'Oprogramowanie & Licencje', iconName: 'AppWindow' },
  NETWORK: { label: 'Sieć & VPN', iconName: 'Network' },
  ACCESS: { label: 'Uprawnienia & Konta', iconName: 'KeyRound' },
  SECURITY: { label: 'Bezpieczeństwo & Incydenty', iconName: 'ShieldAlert' },
  OTHER: { label: 'Inne zgłoszenia', iconName: 'HelpCircle' },
};

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatTimeRemaining(slaDeadline: string, status: TicketStatus): {
  text: string;
  isBreached: boolean;
  badgeClass: string;
} {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return {
      text: 'SLA Spełnione',
      isBreached: false,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  const deadline = new Date(slaDeadline).getTime();
  const now = Date.now();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    const overMinutes = Math.abs(Math.round(diffMs / (60 * 1000)));
    const hours = Math.floor(overMinutes / 60);
    const mins = overMinutes % 60;
    return {
      text: `SLA Przekroczone (-${hours > 0 ? `${hours}h ` : ''}${mins}m)`,
      isBreached: true,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold',
    };
  }

  const remainingMinutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  if (hours < 2) {
    return {
      text: `Pozostało: ${hours > 0 ? `${hours}h ` : ''}${mins}m`,
      isBreached: false,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    };
  }

  return {
    text: `SLA: ${hours}h ${mins}m`,
    isBreached: false,
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
  };
}
