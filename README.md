# 🇮🇳 StatWise — AI-Powered Competency & Learning Intelligence Platform

StatWise is an AI-powered Skill Intelligence and Learning Platform designed specifically for officials working across India's Official Statistical System (MoSPI, DES, NSO, and Line Ministries).

---

## 🌟 Key Features

1. **Employee Competency Profiling**: Visual competency radar across 4 core domains (Statistical Methods, Technical Tools, Digital Governance, Behavioural & Managerial).
2. **Dynamic Skill Gap Engine**: Automatically calculates skill gaps against role requirements (e.g. Statistical Officer, Data Analyst).
3. **AI Recommendations**: Weighted matching engine connecting skill deficits with iGOT Karmayogi and NSSTA/TPAC training programmes.
4. **AI Assessment Studio & Quiz Generator**: Upload PDF/DOCX/PPTX learning materials → generate high-quality MCQs with difficulty control → review & publish quizzes.
5. **Interactive Timed Assessments**: Instant scoring, question-level explanations, and automatic real-time competency score updates.
6. **AI Learning Assistant**: Domain-tuned conversational assistant for career and statistical queries powered by Gemini API.
7. **Executive Workforce Analytics**: Department benchmarking, ministry-wide skill deficit radars, and emerging capabilities forecasting.

---

## 🚀 Quick Start Guide

### 1. Start the Backend (FastAPI + Python 3.13)
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: [http://localhost:8000](http://localhost:8000)  
Interactive API Docs: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

### 2. Start the Frontend (Next.js 14 + Tailwind CSS)
```powershell
cd frontend
npm run dev
```
Frontend Web App will be live at: [http://localhost:3000](http://localhost:3000)

---

## 👥 Demo Personas (Pre-seeded)

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Statistical Officer** | `ananya@statwise.gov.in` | `demo123` | Ananya Sharma (5 yrs exp, M.Sc. Statistics) |
| **Trainer** | `trainer@statwise.gov.in` | `demo123` | Dr. Ramesh Sharma (Senior Training Officer, NSSTA) |
| **Administrator** | `admin@statwise.gov.in` | `demo123` | Vijay Sharma (Director, MoSPI) |

---

## 🏛️ Integration Note
* **iGOT Karmayogi & NSSTA Integration**: Fully structured mock services built with clean production-ready API abstractions for prototype evaluation.
