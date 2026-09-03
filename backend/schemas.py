from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from models import UserRole, TicketPriority, TicketStatus, TicketCategory

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    department: Optional[str] = "Dział Ogólny"

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None

# Comment Schemas
class CommentCreate(BaseModel):
    message: str
    is_internal_note: bool = False

class CommentResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    user_name: str
    user_role: UserRole
    message: str
    is_internal_note: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Audit Schemas
class AuditResponse(BaseModel):
    id: int
    ticket_id: int
    user_id: int
    user_name: str
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Ticket Schemas
class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str
    category: TicketCategory
    priority: TicketPriority

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None
    assigned_agent_id: Optional[int] = None

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    title: str
    description: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    reporter_id: int
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reporter_department: Optional[str] = None
    assigned_agent_id: Optional[int] = None
    assigned_agent_name: Optional[str] = None
    sla_deadline: datetime
    is_sla_breached: bool = False
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    comments_count: Optional[int] = 0

    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    comments: List[CommentResponse] = []
    audit_logs: List[AuditResponse] = []
