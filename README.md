# StudyFlow — Personalised Study & Productivity Platform

> **Study smarter. Stay focused. Learn better.**

StudyFlow is a personal Study Operating System designed to help students and lifelong learners achieve sustained focus, effective retention, and consistent academic progress.

---

## 🌟 Key Features

### 1. Authoritative Focus Timers & Ambient Audio
- **Server-Authoritative Clock**: Prevents timer drift across background tabs, sleep states, or page reloads with millisecond accuracy.
- **Pure Web Audio Ambient Sound**: Synthesizes client-side Brown Noise, Gentle Rain, and 40Hz Gamma Focus Binaural Beats with live volume control (zero external audio file dependencies).
- **Session Lifecycle & Reflection**: Allows pause, resume, early completion, cancellation, and reflection modal with 1–5 star focus ratings and notes.

### 2. 13 Evidence-Backed Study Techniques
- Seeded with comprehensive methodologies: Pomodoro, 52/17, Deep Work, Custom Focus, Time Blocking, Active Recall, Feynman Technique, Interleaving, Spaced Repetition, Brain Dump, Mind Mapping, Eat the Frog, and Two-Minute Rule.
- Direct 1-click launch into preconfigured timer parameters.

### 3. Active Learning Workspaces
- **Feynman Technique Workspace**: 4-step concept mastery editor (target audience selection, simplified explanation, knowledge gap identification, and real-world analogy formulation).
- **Brain Dump Workspace**: Timed active recall writing canvas with side-by-side missing knowledge gap tracking.
- **Interactive Mind Mapping Canvas**: SVG vector node-graph canvas with drag-and-drop nodes, dynamic spline connectors, and instant JSON state persistence.
- **SuperMemo-2 (SM-2) Spaced Repetition Flashcards**: Complete algorithmic flashcard engine with 3D flippable cards, 6-grade recall scoring (0–5), ease factor recalculations, and due review queues.

### 4. Revision Scheduling & Quantitative Goals
- **Topic Revision Calendar**: Automated intervals (Day 1, Day 3, Day 7, Day 14, Day 30) with due queues and recall quality logging.
- **Study Goals Engine**: Create daily, weekly, or monthly focus targets with progress bars and automatic completion triggers.
- **Verified Achievements Engine**: 8 distinct unlockable badges evaluated dynamically against real database logs (`first-session`, `focus-5-hours`, `streak-7-days`, etc.).

### 5. Verified Productivity Analytics & Export
- **100% Dynamic Dashboard**: Zero hardcoded mock numbers or dummy graphs. All charts, streaks, and statistics aggregate directly from database records.
- **Visual Analytics**: 14-day area trends, subject focus distribution, technique usage comparison, and retention accuracy.
- **Cognitive Recommendations Engine**: Recommends personalized study actions based on overdue items, cognitive rhythm, and pending tasks.
- **CSV Study Log Export**: Download authenticated session history for backup or external analysis.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), TypeScript | Fast, type-safe client-side routing & views |
| **Styling** | Tailwind CSS, Lucide React | Clean, responsive UI with accessible colors |
| **Client State** | TanStack React Query, React Context | Server-state caching and JWT auth context |
| **Charts** | Recharts | Area, Bar, and Pie chart visualizations |
| **Audio** | Web Audio API | Low-latency chimes and ambient sound synthesis |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2 | High-performance, modular RESTful API |
| **Database** | PostgreSQL / SQLite, SQLAlchemy 2.0 | Relational persistence & migrations |
| **Migrations** | Alembic | Version-controlled schema migrations |
| **Testing** | Pytest, Starlette TestClient | 19 automated integration and unit tests |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

---

### Option A: Running with Docker Compose (Full Stack)

```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5433` (mapped from container port `5432` to avoid host port conflicts)

---

### Option B: Running Locally (Native)

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The REST API and interactive Swagger documentation will be available at:
`http://localhost:8000/docs`

#### 2. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
The application will be live at:
`http://localhost:3000`

---

## 🧪 Running Automated Tests

Run the comprehensive Pytest suite (19 tests covering authentication, multi-tenant isolation, SM-2 flashcard progression, active learning models, goals/achievements, and Phase 4 recommendations/exports):

```bash
# From the project root
.\backend\venv\Scripts\pytest.exe -v backend/tests
```

---

## 🌐 Production Deployment Guide

### Backend: Deploying to Render
1. Create a new **Web Service** on [Render](https://render.com) connected to your StudyFlow Git repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Python 3`.
4. Set **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
5. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Create a managed **Render PostgreSQL** database and copy the connection string.
7. Configure Environment Variables in Render:
   - `APP_ENV`: `production`
   - `DATABASE_URL`: `postgresql+psycopg://user:password@host/dbname`
   - `JWT_SECRET_KEY`: `<generate-a-strong-random-secret-key>`
   - `FRONTEND_ORIGIN`: `https://your-studyflow-frontend.vercel.app`

### Frontend: Deploying to Vercel
1. Import your StudyFlow repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_API_URL`: `https://your-render-backend.onrender.com/api/v1`
4. Deploy!

---

## 📄 License
MIT License.
