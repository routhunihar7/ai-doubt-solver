# AI Doubt Solver – AI Academic Assistant 🎓⚡

A modern, production-grade full-stack AI academic platform designed for college students and engineering candidates. Built with **FastAPI**, **SQLAlchemy 2**, **PostgreSQL (pgvector)**, **Groq LLM (Llama 3.3)**, **PyMuPDF**, **Redis**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Key Features & Academic Tools

| Tool | Description |
| :--- | :--- |
| 💬 **AI Doubt Solver** | Multi-turn academic conversation tutor with step-by-step intuition, LaTeX formulas (`$...$`), and syntax-highlighted code blocks. |
| 📝 **Quiz Generator** | Generate customizable MCQs (Easy, Medium, Hard) on any subject with instant grading, explanations, and score tracking. |
| 💻 **Code Generator** | Synthesize algorithms across 9+ languages (Python, Java, C++, JS, SQL, Rust, Go) with Big-O complexity & runnable test cases. |
| 📄 **Notes Summarizer** | Transform lecture transcripts and study notes into executive summaries, key concept glossaries, and 5-min cheat sheets. |
| 🎯 **Interview Simulator** | Mock technical interviews (DSA, OS, DBMS, OOP, System Design, AI) with AI scoring (0-10), model answers, and follow-ups. |
| 📅 **Study Planner** | Personalized spaced-repetition study timetable with daily checklists, exam countdown, and milestone roadmaps. |
| 📚 **PDF Assistant (RAG)** | Upload textbooks & lecture slides. Search context via vector embeddings and receive grounded answers citing exact page numbers. |
| 🕒 **Interaction History** | Unified, searchable, and filterable timeline of all previous queries, quizzes, code, notes, and study plans. |
| 👤 **User Profile & Stats** | Track total doubts asked, average quiz scores, study streak goals, and learning preferences. |

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────┐
                                  │       STUDENT / USER      │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   React 19.3 + TypeScript │
                                  │   Vite 8 + Tailwind CSS   │
                                  │   Framer Motion + Lucide  │
                                  └─────────────┬─────────────┘
                                                │ HTTPS / REST
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │        Python 3.14        │
                                  └──────┬─────────────┬──────┘
                                         │             │
                ┌────────────────────────┘             └─────────────────────────┐
                ▼                                                                ▼
      ┌──────────────────┐                                             ┌──────────────────┐
      │  PostgreSQL 18   │                                             │   Groq API LLM   │
      │   + pgvector     │                                             │ (Llama 3.3 70B)  │
      └─────────┬────────┘                                             └──────────────────┘
                │
                ▼
        Document Chunks / RAG
                │
                ▼
              Redis (Cache & Rate Limiting)
```

### Clean Layered Architecture
```
Routes (FastAPI api/v1)
    ↓
Services (Business Logic & Groq AI Prompts)
    ↓
Repositories (SQLAlchemy 2 Data Access Layer)
    ↓
PostgreSQL 18 / pgvector
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.11+** (Tested on Python 3.14)
- **Node.js 20+** and **npm**
- **Groq API Key** (Free tier available at [console.groq.com](https://console.groq.com))

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env

# Add your Groq API Key inside backend/.env:
# GROQ_API_KEY=gsk_your_actual_key_here

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Web App URL: `http://localhost:5173`

---

## 🧪 Running Tests

### Backend Unit & Integration Tests:
```bash
# From workspace root or inside backend folder with venv active
.\backend\.venv\Scripts\pytest backend\tests -v
```

### Frontend Build Verification:
```bash
cd frontend
npm run build
```

---

## 🐳 Docker Deployment (docker-compose)

Run the full production stack locally with a single command:

```bash
# Set your Groq API key in your environment
export GROQ_API_KEY="gsk_your_key_here"

# Build and start all services (Backend, Frontend, PostgreSQL pgvector, Redis)
docker-compose up --build
```

- Frontend App: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## ☁️ Cloud Production Deployment

### Backend (Railway)
1. Link your GitHub repository to [Railway.app](https://railway.app).
2. Provision a **Railway PostgreSQL** service.
3. Add the following Environment Variables in Railway:
   - `DATABASE_URL`: `postgresql+asyncpg://...` (from Railway PostgreSQL)
   - `GROQ_API_KEY`: Your Groq production key
   - `JWT_SECRET`: A long random secret string
   - `ENVIRONMENT`: `production`
   - `CORS_ORIGINS`: Your Vercel frontend URL
4. Railway automatically detects `railway.json` and runs database migrations on deploy.

### Frontend (Vercel)
1. Import your `frontend/` directory into [Vercel](https://vercel.com).
2. Set Environment Variables:
   - `VITE_API_URL`: `https://your-railway-backend-url/api/v1`
3. Deploy! (SPA rewrites are configured in `frontend/vercel.json`).

---

## 🔒 Security & Best Practices
- Passwords hashed with `bcrypt` salt rounds.
- Groq API keys reside **only** in backend environment variables, never sent to the client.
- Vector search with chunk relevance scoring avoids sending whole PDFs to LLMs.
- Strict Pydantic v2 validation on all structured AI outputs with fallback repair logic.
- Centralized exception handling ensures no raw stack traces leak to users.

---

## 📄 License
MIT License. Built for students, educators, and engineers.
