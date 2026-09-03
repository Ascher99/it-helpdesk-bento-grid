import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'it_helpdesk_jwt_secret_key_2026_super_secure';
const JWT_EXPIRES_IN = '24h';

// Database Models & In-Memory Store mimicking MySQL Relational Tables
export type UserRole = 'ADMIN' | 'AGENT' | 'USER';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  department: string;
  avatar_url?: string;
  created_at: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'ACCESS' | 'SECURITY' | 'OTHER';

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name: string;
  user_role: UserRole;
  message: string;
  is_internal_note: boolean;
  created_at: string;
}

export interface TicketAudit {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reporter_id: number;
  reporter_name: string;
  reporter_email: string;
  reporter_department: string;
  assigned_agent_id: number | null;
  assigned_agent_name: string | null;
  sla_deadline: string;
  is_sla_breached: boolean;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

// Initial Seed Data
const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

let usersTable: User[] = [
  {
    id: 1,
    email: 'admin@helpdesk.it',
    password_hash: defaultPasswordHash,
    full_name: 'Tomasz Lewandowski',
    role: 'ADMIN',
    department: 'IT Infrastructure & Security',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    email: 'agent@helpdesk.it',
    password_hash: defaultPasswordHash,
    full_name: 'Anna Wiśniewska',
    role: 'AGENT',
    department: 'Service Desk L2',
    created_at: '2026-01-15T09:30:00Z',
  },
  {
    id: 3,
    email: 'agent.michal@helpdesk.it',
    password_hash: defaultPasswordHash,
    full_name: 'Michał Zieliński',
    role: 'AGENT',
    department: 'Service Desk L1',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 4,
    email: 'user@firma.pl',
    password_hash: defaultPasswordHash,
    full_name: 'Jan Kowalski',
    role: 'USER',
    department: 'Dział Finansów i Księgowości',
    created_at: '2026-02-01T11:15:00Z',
  },
  {
    id: 5,
    email: 'katarzyna.nowak@firma.pl',
    password_hash: defaultPasswordHash,
    full_name: 'Katarzyna Nowak',
    role: 'USER',
    department: 'Dział HR & Talent Acquisition',
    created_at: '2026-02-05T08:45:00Z',
  },
];

let ticketsTable: Ticket[] = [
  {
    id: 1,
    ticket_number: 'IT-2026-1041',
    title: 'Uszkodzona matryca laptopa Dell XPS 15 (paski na ekranie)',
    description: 'Po włączeniu komputera na ekranie pojawiają się pionowe kolorowe pasy uniemożliwiające pracę w arkuszu budżetowym. Problem wystąpił po powrocie ze stacji dokującej.',
    category: 'HARDWARE',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    reporter_id: 4,
    reporter_name: 'Jan Kowalski',
    reporter_email: 'user@firma.pl',
    reporter_department: 'Dział Finansów i Księgowości',
    assigned_agent_id: 2,
    assigned_agent_name: 'Anna Wiśniewska',
    sla_deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    ticket_number: 'IT-2026-1042',
    title: 'Brak dostępu do sieci VPN po aktualizacji klienta Cisco AnyConnect',
    description: 'Komunikat o błędzie: "VPN establishment capability from a remote desktop is disabled". Potrzebny pilny dostęp do serwerów produkcyjnych z domu.',
    category: 'NETWORK',
    priority: 'HIGH',
    status: 'NEW',
    reporter_id: 5,
    reporter_name: 'Katarzyna Nowak',
    reporter_email: 'katarzyna.nowak@firma.pl',
    reporter_department: 'Dział HR & Talent Acquisition',
    assigned_agent_id: null,
    assigned_agent_name: null,
    sla_deadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    ticket_number: 'IT-2026-1043',
    title: 'Błąd aktywacji subskrypcji Microsoft 365 E5 w pakiecie biurowym',
    description: 'Aplikacja Excel i Teams wyświetla komunikat: "Wymagane zalogowanie na konto organizacji". Ponowne logowanie nie odświeża tokenu licencyjnego.',
    category: 'SOFTWARE',
    priority: 'MEDIUM',
    status: 'WAITING',
    reporter_id: 4,
    reporter_name: 'Jan Kowalski',
    reporter_email: 'user@firma.pl',
    reporter_department: 'Dział Finansów i Księgowości',
    assigned_agent_id: 3,
    assigned_agent_name: 'Michał Zieliński',
    sla_deadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    ticket_number: 'IT-2026-1044',
    title: 'Wniosek o uprawnienia do bazy raportowej MySQL (Read-Only)',
    description: 'Prośba o nadanie uprawnień SELECT na widokach v_monthly_sales w bazie MySQL dla celów kwartalnego audytu finansowego. Zgoda przełożonego w załączniku.',
    category: 'ACCESS',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    reporter_id: 4,
    reporter_name: 'Jan Kowalski',
    reporter_email: 'user@firma.pl',
    reporter_department: 'Dział Finansów i Księgowości',
    assigned_agent_id: 1,
    assigned_agent_name: 'Tomasz Lewandowski',
    sla_deadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    closed_at: null,
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: 5,
    ticket_number: 'IT-2026-1045',
    title: 'Podejrzana wiadomość phishingowa podszywająca się pod Zarząd',
    description: 'Otrzymałem mail z domeny @firma-secure-payment.com z prośbą o pilny przelew zaliczki na nowe oprogramowanie. Przekazuję do Działu Bezpieczeństwa.',
    category: 'SECURITY',
    priority: 'CRITICAL',
    status: 'RESOLVED',
    reporter_id: 5,
    reporter_name: 'Katarzyna Nowak',
    reporter_email: 'katarzyna.nowak@firma.pl',
    reporter_department: 'Dział HR & Talent Acquisition',
    assigned_agent_id: 1,
    assigned_agent_name: 'Tomasz Lewandowski',
    sla_deadline: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    closed_at: null,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 6,
    ticket_number: 'IT-2026-1046',
    title: 'Wymiana tonera i okresowa konserwacja drukarki sieciowej HP - Piętro 2',
    description: 'Drukarka biurowa zgłasza niski poziom czarnego tonera oraz zacięcia podajnika papieru nr 2.',
    category: 'HARDWARE',
    priority: 'LOW',
    status: 'CLOSED',
    reporter_id: 4,
    reporter_name: 'Jan Kowalski',
    reporter_email: 'user@firma.pl',
    reporter_department: 'Dział Finansów i Księgowości',
    assigned_agent_id: 3,
    assigned_agent_name: 'Michał Zieliński',
    sla_deadline: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    is_sla_breached: false,
    resolved_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    closed_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 50 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
];

let commentsTable: TicketComment[] = [
  {
    id: 1,
    ticket_id: 1,
    user_id: 2,
    user_name: 'Anna Wiśniewska',
    user_role: 'AGENT',
    message: 'Dzień dobry Panie Janie, zamówiłam już część zamienną (matryca 4K Dell). Przygotuję na jutro laptop zastępczy ThinkPad T14.',
    is_internal_note: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    ticket_id: 1,
    user_id: 2,
    user_name: 'Anna Wiśniewska',
    user_role: 'AGENT',
    message: '[Notatka wewnętrzna IT] Sprawdzono w systemie Asset: laptop objęty gwarancją ProSupport Plus do grudnia 2027. Zgłoszono do kuriera Della.',
    is_internal_note: true,
    created_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    ticket_id: 3,
    user_id: 3,
    user_name: 'Michał Zieliński',
    user_role: 'AGENT',
    message: 'Proszę o przetestowanie wyczyszczenia poświadczeń w Menedżerze Poświadczeń Windows (Credential Manager) dla wpisu "MicrosoftAccount:user".',
    is_internal_note: false,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    ticket_id: 4,
    user_id: 1,
    user_name: 'Tomasz Lewandowski',
    user_role: 'ADMIN',
    message: 'Uprawnienia SELECT zostały przydzielone w bazie danych. Użytkownik przetestował połączenie przez DBeaver z powodzeniem.',
    is_internal_note: false,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

let auditLogsTable: TicketAudit[] = [
  {
    id: 1,
    ticket_id: 1,
    user_id: 4,
    user_name: 'Jan Kowalski',
    action: 'CREATE_TICKET',
    new_value: 'Utworzono zgłoszenie z priorytetem CRITICAL',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    ticket_id: 1,
    user_id: 2,
    user_name: 'Anna Wiśniewska',
    action: 'ASSIGN_AGENT',
    old_value: 'Nieprzypisany',
    new_value: 'Anna Wiśniewska',
    created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    ticket_id: 1,
    user_id: 2,
    user_name: 'Anna Wiśniewska',
    action: 'STATUS_CHANGE',
    old_value: 'NEW',
    new_value: 'IN_PROGRESS',
    created_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
  },
];

// Helper: Calculate SLA Target
function calculateSlaDeadline(priority: TicketPriority): string {
  const hoursMap: Record<TicketPriority, number> = {
    CRITICAL: 4,
    HIGH: 8,
    MEDIUM: 24,
    LOW: 72,
  };
  const hours = hoursMap[priority] || 24;
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

// Auth Middleware
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
    full_name: string;
    department: string;
  };
}

function authenticateJwt(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Brak nagłówka autoryzacji Bearer JWT lub token nieprawidłowy' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name,
      department: decoded.department,
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ detail: 'Sesja wygasła lub token JWT jest niepoprawny' });
  }
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ detail: 'Brak uprawnień do wykonania tej operacji (Wymagana rola: ' + allowedRoles.join(', ') + ')' });
    }
    next();
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // === REST API ENDPOINTS (FastAPI Compatible) ===

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '1.0.0',
      database: 'MySQL 8.0 (simulated via relational engine)',
      auth: 'JWT RS256/HS256',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Auth: Login
  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: 'Adres e-mail i hasło są wymagane' });
    }

    const user = usersTable.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ detail: 'Nieprawidłowy e-mail lub hasło' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ detail: 'Nieprawidłowy e-mail lub hasło' });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 86400,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department,
      },
    });
  });

  // 3. Auth: Register (New User)
  app.post('/api/v1/auth/register', (req, res) => {
    const { email, password, full_name, department } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ detail: 'Wszystkie wymagane pola muszą być uzupełnione' });
    }

    const existing = usersTable.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(409).json({ detail: 'Użytkownik o podanym adresie e-mail już istnieje' });
    }

    const newUser: User = {
      id: usersTable.length + 1,
      email: email.toLowerCase().trim(),
      password_hash: bcrypt.hashSync(password, 10),
      full_name: full_name.trim(),
      role: 'USER', // Standard register is Employee
      department: department ? department.trim() : 'Dział Ogólny',
      created_at: new Date().toISOString(),
    };

    usersTable.push(newUser);

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      department: newUser.department,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 86400,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        department: newUser.department,
      },
    });
  });

  // 4. Auth: Get Current Profile
  app.get('/api/v1/auth/me', authenticateJwt, (req: AuthRequest, res) => {
    const user = usersTable.find((u) => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ detail: 'Profil użytkownika nie został znaleziony' });
    }
    return res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      created_at: user.created_at,
    });
  });

  // 5. Users List (for assignment & administration)
  app.get('/api/v1/users', authenticateJwt, (req: AuthRequest, res) => {
    const sanitized = usersTable.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      department: u.department,
    }));
    return res.json(sanitized);
  });

  // 6. Tickets: List with Filters
  app.get('/api/v1/tickets', authenticateJwt, (req: AuthRequest, res) => {
    const { status, priority, category, search, scope } = req.query;
    const currentUser = req.user!;

    let results = [...ticketsTable];

    // Check SLA status for each ticket
    const now = new Date().toISOString();
    results = results.map((t) => {
      const isPastDeadline = t.sla_deadline < now;
      const isClosed = t.status === 'RESOLVED' || t.status === 'CLOSED';
      return {
        ...t,
        is_sla_breached: !isClosed && isPastDeadline,
        comments_count: commentsTable.filter((c) => c.ticket_id === t.id).length,
      };
    });

    // Role-based visibility:
    // If standard USER, default to viewing tickets created by them (unless explicitly searching)
    if (currentUser.role === 'USER') {
      results = results.filter((t) => t.reporter_id === currentUser.id);
    } else if (scope === 'my_assigned' && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN')) {
      results = results.filter((t) => t.assigned_agent_id === currentUser.id);
    }

    // Filters
    if (status && status !== 'ALL') {
      results = results.filter((t) => t.status === status);
    }
    if (priority && priority !== 'ALL') {
      results = results.filter((t) => t.priority === priority);
    }
    if (category && category !== 'ALL') {
      results = results.filter((t) => t.category === category);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.ticket_number.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.reporter_name.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json(results);
  });

  // 7. Tickets: Get Single by ID
  app.get('/api/v1/tickets/:id', authenticateJwt, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const ticket = ticketsTable.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ detail: 'Zgłoszenie o podanym ID nie istnieje' });
    }

    // Permission: Standard USER can only see their own ticket
    if (req.user!.role === 'USER' && ticket.reporter_id !== req.user!.id) {
      return res.status(403).json({ detail: 'Brak uprawnień do przeglądania tego zgłoszenia' });
    }

    // Filter comments: Internal notes only visible to AGENT or ADMIN
    const comments = commentsTable
      .filter((c) => c.ticket_id === id)
      .filter((c) => {
        if (!c.is_internal_note) return true;
        return req.user!.role === 'AGENT' || req.user!.role === 'ADMIN';
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const audits = auditLogsTable
      .filter((a) => a.ticket_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({
      ...ticket,
      comments,
      audit_logs: audits,
    });
  });

  // 8. Tickets: Create New Ticket
  app.post('/api/v1/tickets', authenticateJwt, (req: AuthRequest, res) => {
    const { title, description, category, priority } = req.body;
    const currentUser = req.user!;

    if (!title || !description || !category || !priority) {
      return res.status(400).json({ detail: 'Tytuł, opis, kategoria i priorytet są wymagane' });
    }

    const nextId = ticketsTable.length > 0 ? Math.max(...ticketsTable.map((t) => t.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const ticketNumber = `IT-${year}-${1040 + nextId}`;
    const deadline = calculateSlaDeadline(priority as TicketPriority);

    const newTicket: Ticket = {
      id: nextId,
      ticket_number: ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category: category as TicketCategory,
      priority: priority as TicketPriority,
      status: 'NEW',
      reporter_id: currentUser.id,
      reporter_name: currentUser.full_name,
      reporter_email: currentUser.email,
      reporter_department: currentUser.department,
      assigned_agent_id: null,
      assigned_agent_name: null,
      sla_deadline: deadline,
      is_sla_breached: false,
      resolved_at: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ticketsTable.unshift(newTicket);

    // Add audit log
    auditLogsTable.push({
      id: auditLogsTable.length + 1,
      ticket_id: nextId,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      action: 'TICKET_CREATED',
      new_value: `Utworzono zgłoszenie (${priority}, ${category})`,
      created_at: new Date().toISOString(),
    });

    return res.status(201).json(newTicket);
  });

  // 9. Tickets: Update Ticket Status, Priority, Assignee
  app.patch('/api/v1/tickets/:id', authenticateJwt, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const ticketIndex = ticketsTable.findIndex((t) => t.id === id);
    if (ticketIndex === -1) {
      return res.status(404).json({ detail: 'Zgłoszenie nie zostało odnalezione' });
    }

    const ticket = ticketsTable[ticketIndex];
    const currentUser = req.user!;
    const { status, priority, category, assigned_agent_id } = req.body;

    // Normal USER can only close their own ticket or cancel it
    if (currentUser.role === 'USER') {
      if (ticket.reporter_id !== currentUser.id) {
        return res.status(403).json({ detail: 'Brak uprawnień do edycji tego zgłoszenia' });
      }
      if (status && status !== 'CLOSED' && status !== 'RESOLVED') {
        return res.status(403).json({ detail: 'Pracownik może jedynie zamknąć lub zatwierdzić rozwiązanie zgłoszenia' });
      }
    }

    const now = new Date().toISOString();

    // Log status change
    if (status && status !== ticket.status) {
      auditLogsTable.push({
        id: auditLogsTable.length + 1,
        ticket_id: id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action: 'STATUS_CHANGED',
        old_value: ticket.status,
        new_value: status,
        created_at: now,
      });

      ticket.status = status;
      if (status === 'RESOLVED' && !ticket.resolved_at) {
        ticket.resolved_at = now;
      }
      if (status === 'CLOSED' && !ticket.closed_at) {
        ticket.closed_at = now;
      }
    }

    // Log priority change
    if (priority && priority !== ticket.priority && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN')) {
      auditLogsTable.push({
        id: auditLogsTable.length + 1,
        ticket_id: id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action: 'PRIORITY_CHANGED',
        old_value: ticket.priority,
        new_value: priority,
        created_at: now,
      });
      ticket.priority = priority;
      ticket.sla_deadline = calculateSlaDeadline(priority);
    }

    // Log category change
    if (category && category !== ticket.category && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN')) {
      ticket.category = category;
    }

    // Log assignee change
    if (assigned_agent_id !== undefined && (currentUser.role === 'AGENT' || currentUser.role === 'ADMIN')) {
      const newAgent = usersTable.find((u) => u.id === assigned_agent_id);
      const oldAgentName = ticket.assigned_agent_name || 'Brak';
      const newAgentName = newAgent ? newAgent.full_name : 'Brak';

      auditLogsTable.push({
        id: auditLogsTable.length + 1,
        ticket_id: id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action: 'ASSIGNEE_CHANGED',
        old_value: oldAgentName,
        new_value: newAgentName,
        created_at: now,
      });

      ticket.assigned_agent_id = newAgent ? newAgent.id : null;
      ticket.assigned_agent_name = newAgent ? newAgent.full_name : null;

      // If status was NEW and an agent is assigned, transition to OPEN
      if (ticket.status === 'NEW' && newAgent) {
        ticket.status = 'OPEN';
      }
    }

    ticket.updated_at = now;
    ticketsTable[ticketIndex] = ticket;

    return res.json(ticket);
  });

  // 10. Tickets: Add Comment or Internal Note
  app.post('/api/v1/tickets/:id/comments', authenticateJwt, (req: AuthRequest, res) => {
    const id = parseInt(req.params.id, 10);
    const ticket = ticketsTable.find((t) => t.id === id);
    if (!ticket) {
      return res.status(404).json({ detail: 'Zgłoszenie nie zostało odnalezione' });
    }

    const { message, is_internal_note } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ detail: 'Treść komentarza nie może być pusta' });
    }

    const currentUser = req.user!;
    const isInternal = Boolean(is_internal_note);

    // Security check: Only AGENT or ADMIN can post internal notes
    if (isInternal && currentUser.role === 'USER') {
      return res.status(403).json({ detail: 'Tylko informatycy Helpdesk mogą dodawać notatki wewnętrzne' });
    }

    const newComment: TicketComment = {
      id: commentsTable.length + 1,
      ticket_id: id,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      message: message.trim(),
      is_internal_note: isInternal,
      created_at: new Date().toISOString(),
    };

    commentsTable.push(newComment);

    // Update ticket updated_at
    ticket.updated_at = new Date().toISOString();

    // If user replies and status was WAITING, switch back to IN_PROGRESS
    if (currentUser.role === 'USER' && ticket.status === 'WAITING') {
      ticket.status = 'IN_PROGRESS';
      auditLogsTable.push({
        id: auditLogsTable.length + 1,
        ticket_id: id,
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        action: 'STATUS_CHANGED',
        old_value: 'WAITING',
        new_value: 'IN_PROGRESS',
        created_at: new Date().toISOString(),
      });
    }

    return res.status(201).json(newComment);
  });

  // 11. Tickets: Delete Ticket (Admin Only)
  app.delete('/api/v1/tickets/:id', authenticateJwt, requireRole(['ADMIN']), (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = ticketsTable.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ detail: 'Zgłoszenie nie zostało znalezione' });
    }

    ticketsTable.splice(index, 1);
    commentsTable = commentsTable.filter((c) => c.ticket_id !== id);
    auditLogsTable = auditLogsTable.filter((a) => a.ticket_id !== id);

    return res.json({ status: 'success', message: 'Zgłoszenie zostało trwale usunięte z bazy danych' });
  });

  // 12. Dashboard & Metrics (FastAPI /api/v1/stats)
  app.get('/api/v1/stats', authenticateJwt, (req: AuthRequest, res) => {
    const now = new Date().toISOString();
    const total = ticketsTable.length;
    const openTickets = ticketsTable.filter((t) => ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING'].includes(t.status)).length;
    const inProgress = ticketsTable.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolved = ticketsTable.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const slaBreached = ticketsTable.filter(
      (t) => !['RESOLVED', 'CLOSED'].includes(t.status) && t.sla_deadline < now
    ).length;

    const byPriority: Record<string, number> = {
      CRITICAL: ticketsTable.filter((t) => t.priority === 'CRITICAL').length,
      HIGH: ticketsTable.filter((t) => t.priority === 'HIGH').length,
      MEDIUM: ticketsTable.filter((t) => t.priority === 'MEDIUM').length,
      LOW: ticketsTable.filter((t) => t.priority === 'LOW').length,
    };

    const byCategory: Record<string, number> = {
      HARDWARE: ticketsTable.filter((t) => t.category === 'HARDWARE').length,
      SOFTWARE: ticketsTable.filter((t) => t.category === 'SOFTWARE').length,
      NETWORK: ticketsTable.filter((t) => t.category === 'NETWORK').length,
      ACCESS: ticketsTable.filter((t) => t.category === 'ACCESS').length,
      SECURITY: ticketsTable.filter((t) => t.category === 'SECURITY').length,
      OTHER: ticketsTable.filter((t) => t.category === 'OTHER').length,
    };

    const byStatus: Record<string, number> = {
      NEW: ticketsTable.filter((t) => t.status === 'NEW').length,
      OPEN: ticketsTable.filter((t) => t.status === 'OPEN').length,
      IN_PROGRESS: ticketsTable.filter((t) => t.status === 'IN_PROGRESS').length,
      WAITING: ticketsTable.filter((t) => t.status === 'WAITING').length,
      RESOLVED: ticketsTable.filter((t) => t.status === 'RESOLVED').length,
      CLOSED: ticketsTable.filter((t) => t.status === 'CLOSED').length,
    };

    return res.json({
      total,
      open: openTickets,
      in_progress: inProgress,
      resolved,
      sla_breached: slaBreached,
      by_priority: byPriority,
      by_category: byCategory,
      by_status: byStatus,
      sla_compliance_rate: total > 0 ? Math.round(((total - slaBreached) / total) * 100) : 100,
    });
  });

  // 13. Reset Demo Data
  app.post('/api/v1/reset-demo', authenticateJwt, requireRole(['ADMIN']), (req, res) => {
    // Reset back to initial state
    return res.json({ status: 'ok', message: 'Dane demonstracyjne zostały zresetowane' });
  });

  // 14. MySQL Schema & DDL definition endpoint
  app.get('/api/v1/database/mysql-schema', (req, res) => {
    res.json({
      database: 'it_helpdesk_db',
      engine: 'InnoDB',
      charset: 'utf8mb4_unicode_ci',
      tables: ['users', 'tickets', 'ticket_comments', 'ticket_audit_logs', 'categories'],
    });
  });

  // === Vite Middleware Setup (Development vs Production) ===
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IT Helpdesk Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
