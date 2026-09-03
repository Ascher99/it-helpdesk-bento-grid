# IT Helpdesk Ticketing System - Backend (FastAPI + MySQL)

Kompletny, produkcyjny backend dla systemu Helpdesk IT oparty na frameworku **FastAPI (Python 3.10+)**, bazie danych **MySQL 8.0**, systemie ORM **SQLAlchemy 2.0** oraz autoryzacji tokenami **JWT (Bearer Tokens)**.

## 🚀 Szybki start (Docker Compose)

Najprostszym sposobem uruchomienia bazy MySQL 8 i API FastAPI jest:

```bash
docker compose up --build -d
```

- **Swagger UI / Dokumentacja OpenAPI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Port bazy danych MySQL:** `3306`
  - Baza: `it_helpdesk_db`
  - Użytkownik: `helpdesk_user`
  - Hasło: `helpdesk_secret_2026`

## 📦 Uruchomienie lokalne (bez Dockera)

1. **Zainstaluj zależności:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Skonfiguruj bazę MySQL:**
   - Wykonaj skrypt `schema.sql` na swoim lokalnym serwerze MySQL:
     ```bash
     mysql -u root -p < schema.sql
     ```

3. **Ustaw zmienne środowiskowe:**
   ```bash
   export DATABASE_URL="mysql+pymysql://helpdesk_user:helpdesk_secret_2026@localhost:3306/it_helpdesk_db?charset=utf8mb4"
   export JWT_SECRET="twoj_bezpieczny_klucz_jwt_2026"
   ```

4. **Uruchom serwer developerski Uvicorn:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## 🔐 Konta demonstracyjne (JWT Demo)

Wszystkie konta posiadają hasło: `Password123!`

- **Administrator:** `admin@helpdesk.it` (pełne uprawnienia, podgląd wszystkich zgłoszeń, usuwanie, audyt)
- **Agent L2 / Informatyk:** `agent@helpdesk.it` (zmiana statusów, dodawanie notatek wewnętrznych, przypisywanie)
- **Agent L1 / Informatyk:** `agent.michal@helpdesk.it`
- **Pracownik (User):** `user@firma.pl` (tworzenie zgłoszeń, podgląd własnych spraw, publiczne komentarze)
- **Pracownik (User):** `katarzyna.nowak@firma.pl`
