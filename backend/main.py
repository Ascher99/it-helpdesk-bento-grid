from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional

from database import engine, get_db, Base
import models
import schemas
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_roles,
)

# Auto-create tables on startup (or via Alembic/schema.sql)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IT Helpdesk Ticketing System API",
    description="Pełnostosowy system zarządzania zgłoszeniami IT z uwierzytelnianiem JWT i bazą MySQL",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_sla_deadline(priority: models.TicketPriority) -> datetime:
    hours_map = {
        models.TicketPriority.CRITICAL: 4,
        models.TicketPriority.HIGH: 8,
        models.TicketPriority.MEDIUM: 24,
        models.TicketPriority.LOW: 72,
    }
    return datetime.utcnow() + timedelta(hours=hours_map.get(priority, 24))

# ----------------- AUTH ROUTER -----------------
@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy login lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": user,
    }

@app.post("/api/v1/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Użytkownik o podanym adresie e-mail już istnieje",
        )
    
    new_user = models.User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        department=user_in.department or "Dział Ogólny",
        role=models.UserRole.USER,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 86400,
        "user": new_user,
    }

@app.get("/api/v1/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/v1/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles([models.UserRole.ADMIN, models.UserRole.AGENT])),
):
    return db.query(models.User).all()

# ----------------- TICKETS ROUTER -----------------
@app.get("/api/v1/tickets", response_model=List[schemas.TicketResponse])
def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Ticket)

    # Standard employee sees only their own tickets
    if current_user.role == models.UserRole.USER:
        query = query.filter(models.Ticket.reporter_id == current_user.id)

    if status and status != "ALL":
        query = query.filter(models.Ticket.status == status)
    if priority and priority != "ALL":
        query = query.filter(models.Ticket.priority == priority)
    if category and category != "ALL":
        query = query.filter(models.Ticket.category == category)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Ticket.title.ilike(search_pattern)) |
            (models.Ticket.ticket_number.ilike(search_pattern)) |
            (models.Ticket.description.ilike(search_pattern))
        )

    tickets = query.order_by(models.Ticket.created_at.desc()).all()
    now = datetime.utcnow()
    
    response = []
    for t in tickets:
        is_breached = (t.status not in [models.TicketStatus.RESOLVED, models.TicketStatus.CLOSED]) and (t.sla_deadline < now)
        ticket_dict = {
            "id": t.id,
            "ticket_number": t.ticket_number,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "reporter_id": t.reporter_id,
            "reporter_name": t.reporter.full_name if t.reporter else None,
            "reporter_email": t.reporter.email if t.reporter else None,
            "reporter_department": t.reporter.department if t.reporter else None,
            "assigned_agent_id": t.assigned_agent_id,
            "assigned_agent_name": t.assigned_agent.full_name if t.assigned_agent else None,
            "sla_deadline": t.sla_deadline,
            "is_sla_breached": is_breached,
            "resolved_at": t.resolved_at,
            "closed_at": t.closed_at,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "comments_count": len(t.comments),
        }
        response.append(ticket_dict)
    return response

@app.post("/api/v1/tickets", response_model=schemas.TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    count = db.query(func.count(models.Ticket.id)).scalar() or 0
    ticket_number = f"IT-{datetime.utcnow().year}-{1040 + count + 1}"
    deadline = calculate_sla_deadline(ticket_in.priority)

    ticket = models.Ticket(
        ticket_number=ticket_number,
        title=ticket_in.title,
        description=ticket_in.description,
        category=ticket_in.category,
        priority=ticket_in.priority,
        status=models.TicketStatus.NEW,
        reporter_id=current_user.id,
        sla_deadline=deadline,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    audit = models.TicketAuditLog(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="TICKET_CREATED",
        new_value=f"Utworzono zgłoszenie ({ticket.priority.value}, {ticket.category.value})",
    )
    db.add(audit)
    db.commit()

    return {
        **ticket.__dict__,
        "reporter_name": current_user.full_name,
        "reporter_email": current_user.email,
        "reporter_department": current_user.department,
        "is_sla_breached": False,
        "comments_count": 0,
    }

@app.get("/api/v1/tickets/{ticket_id}", response_model=schemas.TicketDetailResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")

    if current_user.role == models.UserRole.USER and ticket.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Brak dostępu do tego zgłoszenia")

    # Filter internal comments for non-agents
    comments = []
    for c in ticket.comments:
        if c.is_internal_note and current_user.role == models.UserRole.USER:
            continue
        comments.append({
            "id": c.id,
            "ticket_id": c.ticket_id,
            "user_id": c.user_id,
            "user_name": c.user.full_name if c.user else "Nieznany",
            "user_role": c.user.role if c.user else models.UserRole.USER,
            "message": c.message,
            "is_internal_note": c.is_internal_note,
            "created_at": c.created_at,
        })

    audits = [
        {
            "id": a.id,
            "ticket_id": a.ticket_id,
            "user_id": a.user_id,
            "user_name": a.user.full_name if a.user else "System",
            "action": a.action,
            "old_value": a.old_value,
            "new_value": a.new_value,
            "created_at": a.created_at,
        }
        for a in ticket.audit_logs
    ]

    return {
        "id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "reporter_id": ticket.reporter_id,
        "reporter_name": ticket.reporter.full_name if ticket.reporter else None,
        "reporter_email": ticket.reporter.email if ticket.reporter else None,
        "reporter_department": ticket.reporter.department if ticket.reporter else None,
        "assigned_agent_id": ticket.assigned_agent_id,
        "assigned_agent_name": ticket.assigned_agent.full_name if ticket.assigned_agent else None,
        "sla_deadline": ticket.sla_deadline,
        "is_sla_breached": (ticket.status not in [models.TicketStatus.RESOLVED, models.TicketStatus.CLOSED]) and (ticket.sla_deadline < datetime.utcnow()),
        "resolved_at": ticket.resolved_at,
        "closed_at": ticket.closed_at,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "comments": comments,
        "audit_logs": audits,
    }

@app.patch("/api/v1/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")

    if current_user.role == models.UserRole.USER and ticket.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Brak uprawnień do edycji tego zgłoszenia")

    if ticket_update.status and ticket_update.status != ticket.status:
        db.add(models.TicketAuditLog(
            ticket_id=ticket.id,
            user_id=current_user.id,
            action="STATUS_CHANGED",
            old_value=ticket.status.value,
            new_value=ticket_update.status.value,
        ))
        ticket.status = ticket_update.status
        if ticket_update.status == models.TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        if ticket_update.status == models.TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()

    if current_user.role in [models.UserRole.AGENT, models.UserRole.ADMIN]:
        if ticket_update.priority and ticket_update.priority != ticket.priority:
            ticket.priority = ticket_update.priority
            ticket.sla_deadline = calculate_sla_deadline(ticket_update.priority)
        if ticket_update.category:
            ticket.category = ticket_update.category
        if ticket_update.assigned_agent_id is not None:
            agent = db.query(models.User).filter(models.User.id == ticket_update.assigned_agent_id).first()
            ticket.assigned_agent_id = agent.id if agent else None
            if ticket.status == models.TicketStatus.NEW and agent:
                ticket.status = models.TicketStatus.OPEN

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket

@app.post("/api/v1/tickets/{ticket_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    comment_in: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Zgłoszenie nie zostało odnalezione")

    if comment_in.is_internal_note and current_user.role == models.UserRole.USER:
        raise HTTPException(status_code=403, detail="Użytkownicy nie mogą dodawać notatek wewnętrznych")

    comment = models.TicketComment(
        ticket_id=ticket.id,
        user_id=current_user.id,
        message=comment_in.message,
        is_internal_note=comment_in.is_internal_note,
    )
    db.add(comment)
    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "ticket_id": comment.ticket_id,
        "user_id": comment.user_id,
        "user_name": current_user.full_name,
        "user_role": current_user.role,
        "message": comment.message,
        "is_internal_note": comment.is_internal_note,
        "created_at": comment.created_at,
    }

# ----------------- STATS ROUTER -----------------
@app.get("/api/v1/stats")
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total = db.query(models.Ticket).count()
    open_count = db.query(models.Ticket).filter(
        models.Ticket.status.in_([models.TicketStatus.NEW, models.TicketStatus.OPEN, models.TicketStatus.IN_PROGRESS, models.TicketStatus.WAITING])
    ).count()
    in_progress = db.query(models.Ticket).filter(models.Ticket.status == models.TicketStatus.IN_PROGRESS).count()
    resolved = db.query(models.Ticket).filter(
        models.Ticket.status.in_([models.TicketStatus.RESOLVED, models.TicketStatus.CLOSED])
    ).count()

    now = datetime.utcnow()
    sla_breached = db.query(models.Ticket).filter(
        ~models.Ticket.status.in_([models.TicketStatus.RESOLVED, models.TicketStatus.CLOSED]),
        models.Ticket.sla_deadline < now
    ).count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "sla_breached": sla_breached,
        "sla_compliance_rate": round(((total - slaBreached) / total) * 100) if total > 0 else 100,
    }
