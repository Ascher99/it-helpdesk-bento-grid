@'
# IT Helpdesk & Ticketing System (Bento Grid)

A modern, full-stack **IT Helpdesk & Incident Management System** featuring a high-contrast **Bento Grid** dashboard, role-based access control with **JWT authentication**, SLA compliance tracking, discussion threads with internal IT notes, and full enterprise architecture specifications (**FastAPI + MySQL 8.0**).

---

## 🌟 Key Features

- **Bento Grid Dashboard**:
  - Signature tiles highlighting active open incidents, SLA resolution rates, and system latency.
  - Interactive priority distribution and category breakdown metrics.
  - Quick action tile to immediately draft and dispatch new service requests.
- **Role-Based JWT Authentication**:
  - Secure HS256 signed access tokens with configurable expiration (TTL).
  - Built-in test roles and accounts:
    - **Administrator** (`ADMIN`): full system management, agent reassignment, audit trail oversight.
    - **IT Specialist / Support** (`AGENT`): ticket lifecycle resolution, internal private IT notes.
    - **Company Employee** (`USER`): issue reporting, progress tracking, and conversation replies.
  - Integrated **JWT Inspector Modal** to inspect raw headers, claims (`sub`, `role`, `department`, `iat`, `exp`), and validity in real time.
- **Complete Ticket Lifecycle & SLA Tracker**:
  - Unique case numbering format (`#IT-2026-1041`).
  - Statuses: *New*, *Open*, *In Progress*, *Waiting for Response*, *Resolved*, *Closed*.
  - Strict SLA limits: **Critical (4h)**, **High (8h)**, **Medium (24h)**, **Low (72h)** with live countdowns and breach alerts.
  - Internal IT private notes (flagged with a lock icon, hidden from regular users).
  - Detailed chronological audit trail logging every status change and assignment.
- **Export & Search**:
  - Full-text search by title, description, ticket number, or reporter name.
  - Instant export to **CSV** and **JSON** formats.
- **Production Backend Architecture (`/backend`)**:
  - Complete Python **FastAPI** REST API implementation (`main.py`, `models.py`, `schemas.py`, `auth.py`).
  - Production **MySQL 8.0** relational schema with foreign keys, indexes, and sample seeds (`schema.sql`).
  - Ready-to-run `docker-compose.yml` for zero-configuration containerized deployment.

---

## 📐 Tech Stack

### Frontend & App Server
- **React 19 / 18** (TypeScript, Hooks, Context, Modular Component Architecture)
- **Vite** (Next-generation frontend tooling)
- **Tailwind CSS v4** (Modern utility styling and Bento Grid layout)
- **Lucide Icons** (Clean, uniform system vector icons)
- **Express / Node.js Proxy** (`server.ts` with TypeScript bundling via `esbuild`)

### Backend Specification (`/backend`)
- **FastAPI** (Python 3.10+ async REST framework)
- **SQLAlchemy 2.0 ORM** (Relational data modeling)
- **PyMySQL & MySQL 8.0** (Database engine with indexed relationships)
- **Python-Jose / PyJWT** (Token issuance and validation)
- **Passlib & Bcrypt** (Salted password hashing)

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18+ & **npm** (or **bun** / **yarn**)

### 2. Installation & Running Locally

```bash
# Clone the repository
git clone https://github.com/Ascher99/it-helpdesk-bento-grid.git
cd it-helpdesk-bento-grid

# Install dependencies
npm install

# Start development server
npm run dev
