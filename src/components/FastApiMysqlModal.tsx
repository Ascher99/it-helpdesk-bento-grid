import React, { useState } from 'react';
import { X, Database, Terminal, Server, Copy, Check, ExternalLink, Code } from 'lucide-react';

interface FastApiMysqlModalProps {
  onClose: () => void;
}

export const FastApiMysqlModal: React.FC<FastApiMysqlModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'mysql' | 'fastapi' | 'docker' | 'api'>('mysql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const mysqlSchemaCode = `-- ==========================================================
-- IT HELPDESK TICKETING SYSTEM - BAZA DANYCH MYSQL 8.0
-- Architektura relacyjna z indeksami, kluczami obcymi i audytem
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`it_helpdesk_db\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE \`it_helpdesk_db\`;

-- 1. TABELA UŻYTKOWNIKÓW (ROLES: ADMIN, AGENT, USER)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(120) NOT NULL,
  \`role\` ENUM('ADMIN', 'AGENT', 'USER') NOT NULL DEFAULT 'USER',
  \`department\` VARCHAR(100) NOT NULL DEFAULT 'Dział Ogólny',
  \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_users_role\` (\`role\`),
  INDEX \`idx_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABELA ZGŁOSZEŃ (TICKETS)
CREATE TABLE IF NOT EXISTS \`tickets\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ticket_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`category\` ENUM('HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'SECURITY', 'OTHER') NOT NULL,
  \`priority\` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  \`status\` ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'NEW',
  \`reporter_id\` INT NOT NULL,
  \`assigned_agent_id\` INT NULL,
  \`sla_deadline\` DATETIME NOT NULL,
  \`resolved_at\` DATETIME NULL,
  \`closed_at\` DATETIME NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`reporter_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`assigned_agent_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
  INDEX \`idx_tickets_status\` (\`status\`),
  INDEX \`idx_tickets_priority\` (\`priority\`),
  INDEX \`idx_tickets_assigned\` (\`assigned_agent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. KOMENTARZE I NOTATKI WEWNĘTRZNE IT
CREATE TABLE IF NOT EXISTS \`ticket_comments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ticket_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL,
  \`message\` TEXT NOT NULL,
  \`is_internal_note\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
  INDEX \`idx_comments_ticket\` (\`ticket_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. DZIENNIK AUDYTU ZMIAN (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS \`ticket_audit_logs\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`ticket_id\` INT NOT NULL,
  \`user_id\` INT NOT NULL,
  \`action\` VARCHAR(60) NOT NULL,
  \`old_value\` VARCHAR(255) NULL,
  \`new_value\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`ticket_id\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  const fastApiMainSnippet = `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db, engine, Base
import models, schemas, auth

app = FastAPI(title="IT Helpdesk API", version="1.0.0")

@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login(form_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Niepoprawny login lub hasło")
    
    token = auth.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/api/v1/tickets", response_model=list[schemas.TicketResponse])
def get_tickets(status: str = None, priority: str = None, db: Session = Depends(get_db), current_user = Depends(auth.get_current_user)):
    query = db.query(models.Ticket)
    if current_user.role == models.UserRole.USER:
        query = query.filter(models.Ticket.reporter_id == current_user.id)
    if status and status != 'ALL':
        query = query.filter(models.Ticket.status == status)
    return query.order_by(models.Ticket.created_at.desc()).all()`;

  const dockerComposeSnippet = `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: helpdesk_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_super_secret_password_2026
      MYSQL_DATABASE: it_helpdesk_db
      MYSQL_USER: helpdesk_user
      MYSQL_PASSWORD: helpdesk_secret_2026
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./schema.sql:/docker-entrypoint-initdb.d/init.sql

  fastapi_backend:
    build: .
    container_name: helpdesk_fastapi
    restart: always
    depends_on:
      - mysql
    environment:
      DATABASE_URL: mysql+pymysql://helpdesk_user:helpdesk_secret_2026@mysql:3306/it_helpdesk_db?charset=utf8mb4
      JWT_SECRET: it_helpdesk_jwt_secret_key_2026_super_secure
    ports:
      - "8000:8000"
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  mysql_data:`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold">Architektura Backendowa (FastAPI + MySQL)</h2>
              <p className="text-xs text-slate-400">Specyfikacja relacyjna, ORM SQLAlchemy oraz routing API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('mysql')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'mysql'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Schemat MySQL 8 (schema.sql)</span>
          </button>

          <button
            onClick={() => setActiveTab('fastapi')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'fastapi'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Kod FastAPI & SQLAlchemy</span>
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'docker'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Docker Compose</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Punkty końcowe REST (OpenAPI)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {activeTab === 'mysql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Kompletny plik DDL bazy danych MySQL 8.0 z kluczami obcymi, transakcjami InnoDB i indeksami b-tree.
                </p>
                <button
                  onClick={() => copyToClipboard(mysqlSchemaCode, 'mysql')}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedKey === 'mysql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'mysql' ? 'Skopiowano DDL!' : 'Kopiuj SQL'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[50vh]">
                {mysqlSchemaCode}
              </pre>
            </div>
          )}

          {activeTab === 'fastapi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Implementacja endpointów i zależności weryfikacji tokenu JWT w Pythonie (FastAPI + SQLAlchemy).
                </p>
                <button
                  onClick={() => copyToClipboard(fastApiMainSnippet, 'fastapi')}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedKey === 'fastapi' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'fastapi' ? 'Skopiowano kod!' : 'Kopiuj Python'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[50vh]">
                {fastApiMainSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Konfiguracja kontenerów Docker Compose do uruchomienia bazy MySQL 8 i FastAPI jednym poleceniem.
                </p>
                <button
                  onClick={() => copyToClipboard(dockerComposeSnippet, 'docker')}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'docker' ? 'Skopiowano YAML!' : 'Kopiuj Compose'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[50vh]">
                {dockerComposeSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="text-slate-600">
                Wykaz endpointów REST API obsługiwanych przez system:
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                <div className="p-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">POST</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/auth/login</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Uwierzytelnienie użytkownika, zwrot tokenu JWT</span>
                </div>

                <div className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">GET</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/auth/me</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Profil bieżącego użytkownika (wymaga Bearer JWT)</span>
                </div>

                <div className="p-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">GET</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/tickets</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Lista zgłoszeń z filtrowaniem statusu, priorytetu, SLA</span>
                </div>

                <div className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">POST</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/tickets</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Rejestracja nowego zgłoszenia i kalkulacja SLA</span>
                </div>

                <div className="p-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">PATCH</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/tickets/:id</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Aktualizacja statusu, przypisania opiekuna, priorytetu</span>
                </div>

                <div className="p-3 bg-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">POST</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/tickets/:id/comments</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Dodanie komentarza lub notatki wewnętrznej IT</span>
                </div>

                <div className="p-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">GET</span>
                    <span className="font-mono text-xs font-semibold text-slate-800">/api/v1/stats</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Wskaźniki SLA, metryki obciążenia i rozkładu awarii</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
