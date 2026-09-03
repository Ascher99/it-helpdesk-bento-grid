export type UserRole = 'ADMIN' | 'AGENT' | 'USER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  created_at?: string;
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
  comments?: TicketComment[];
  audit_logs?: TicketAudit[];
}

export interface TicketFilterState {
  status: string;
  priority: string;
  category: string;
  search: string;
  scope: 'all' | 'my_assigned' | 'my_reported';
}

export interface StatsData {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  sla_breached: number;
  sla_compliance_rate: number;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
}

export interface DecodedJwt {
  sub: number;
  email: string;
  full_name: string;
  role: UserRole;
  department: string;
  iat: number;
  exp: number;
}
