# 🥗 NutriAI — AI-Powered Meal & Fitness Planner

A full-stack AI health platform that turns your body profile into a personalized Indian meal plan, grocery list, and workout schedule — powered by Gemini 2.5 Flash.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://diet-planner-three-sable.vercel.app/login)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%20(Neon)-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Gemini](https://img.shields.io/badge/Gemini%202.5%20Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

---

## 📖 Overview

NutriAI is a production-grade, full-stack health application that generates scientifically-grounded Indian diet and fitness plans from a 19-field user profile. A six-step onboarding flow captures age, body metrics, goals, diet preferences, beverage habits, fasting schedules, and gym routines; the backend then computes a Mifflin-St Jeor TDEE and uses Gemini 2.5 Flash to produce 3-day meal plans, a derived grocery list, and a weekly training plan.

Beyond generation, NutriAI closes the loop on real-world eating: log a cheat meal by photo or text, get AI-estimated macros with a confidence score, and watch upcoming meals automatically re-balance to compensate. The frontend visualizes every meal as an interactive 5-macro "flower," and the whole platform runs on free-tier infrastructure (Render + Vercel + Neon) with a live demo.

---

## ✨ Features

- **Full-stack AI health platform** — a Django REST API and a React (Vite) mobile-first SPA working together, with a 6-step onboarding flow that captures **19 profile fields** across **5 modular Django apps** (`users`, `meals`, `cheat_meals`, `grocery`, `training`).
- **Deployed end-to-end on free-tier infrastructure** — backend on Render, frontend on Vercel, PostgreSQL on Neon, with CI/CD wired through GitHub Actions.
- **Personalized Indian meal plans** — Gemini 2.5 Flash generates a 3-day plan (9 unique meals) tuned across **4 goals** (muscle building, fat loss, weight loss, maintenance) and **3 diet types** (Jain, vegetarian, non-vegetarian), including fasting-day-aware menus.
- **Science-based calorie engine** — TDEE is derived from the **Mifflin-St Jeor** BMR formula across **5 activity multipliers**, then adjusted by goal (+300/−600 kcal), with beverage calories subtracted before meals are split 30/40/30 (or 28/38/34 for bulking goals).
- **Validated AI output** — every Gemini response is parsed and validated with **Pydantic schemas**, enforcing macro sanity checks (calories ≈ protein×4 + carbs×4 + fats×9 within a **±25 kcal tolerance**) across the plan endpoints.
- **Reliable generation** — a **2-model fallback chain** (`gemini-2.5-flash-lite` → `gemini-2.5-flash`) with retries and exponential backoff keeps plan generation resilient to API hiccups.
- **Smart cheat meal logging** — log a cheat meal via **image upload or text**, get a **2-round AI follow-up Q&A** when more info is needed, a **3-level confidence/size classification** (small/medium/large), and **automatic calorie adjustment** spread across the next 2/4/7 days with a note written into each affected day.
- **Per-meal nutrition visualization** — each meal renders as a **5-macro flower UI** (protein, carbs, fats, fiber, calories) across 3 meal slots per day, with a full ingredient breakdown and diet tags (Jain/fasting-friendly).
- **Dynamic grocery lists** — per-ingredient quantities are aggregated across all meal slots, aliases are merged (e.g. "tomato puree" → "Tomato"), units are normalized, and the list can be filtered by date range; it's flagged for refresh whenever a plan or cheat meal changes.
- **Performance-minded persistence** — bulk DB inserts replace individual writes per plan (~78% fewer DB operations), plus N+1-eliminating batch endpoints, `select_related`/`prefetch_related`, and DB performance indexes.

---

## 📸 Screenshots

A walkthrough of the app flow, from sign-in to training plan. Screenshots live in [`./assets/`](./assets).

<details>
<summary><b>1 · Auth — Login</b></summary>

Glassmorphic sign-in screen with the animated food background. Authentication uses JWT (access + refresh tokens with rotation and blacklisting).

![Auth page](./assets/auth_page.jpeg)
</details>

<details>
<summary><b>2 · Onboarding — Personal Details</b></summary>

Step of the 6-step onboarding wizard capturing body metrics (gender, age, height, weight, target weight) against a changing background per step. All 19 profile fields feed the TDEE engine.

![Personal details onboarding](./assets/personal_details_page.jpeg)
</details>

<details>
<summary><b>3 · Dashboard</b></summary>

Today's summary at a glance — calorie ring against the daily target, macro bars, BMI card, weight trend, and quick actions to generate meals, log a cheat meal, or open the training plan.

![Dashboard](./assets/dashboard_page.jpeg)
</details>

<details>
<summary><b>4 · Nutrition — Weekly Plan</b></summary>

The nutrition hub with a swipeable date strip, per-day meal cards (breakfast / lunch / dinner), and entry points to the grocery list, PDF export, and cheat-meal logging.

![Nutrition page](./assets/nutrition_page.jpeg)
</details>

<details>
<summary><b>5 · Nutrition — Features & Grocery</b></summary>

Plan-level features: the aggregated grocery sheet with per-ingredient quantities and check-off tracking, plus date-range filtering and generation status.

![Nutrition features and grocery](./assets/nutrition_page_features.jpeg)
</details>

<details>
<summary><b>6 · Meal Details — Macro Flower</b></summary>

Individual meal detail rendered as the 5-macro flower UI (protein, carbs, fats, fiber, calories) with an ingredient-by-ingredient breakdown, serving size, and diet tags.

![Meal details](./assets/meal_details.jpeg)
</details>

<details>
<summary><b>7 · Cheat Meal Logging</b></summary>

Cheat meal flow — upload a photo or describe the meal, review the AI's macro estimate with confidence scoring, answer a follow-up question when needed, and let the app re-balance upcoming days.

![Cheat meal page](./assets/cheat_meal_page.jpeg)
</details>

<details>
<summary><b>8 · Cooking Loader</b></summary>

The animated "cooking" loader shown while Gemini generates a plan — playful progress steps that keep users informed during the multi-second generation request.

![Cooking loader](./assets/cooking_loader.jpeg)
</details>

<details>
<summary><b>9 · Training Plan</b></summary>

Weekly training plan with a day strip, exercise lists with sets/reps/rest, day notes, and PDF export — generated from the same profile used for meals.

![Training details](./assets/training_details.jpeg)
</details>

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19.2 · React Router 7.13 · Vite 8 · Tailwind CSS 4 · Axios · Framer Motion 12 · lucide-react · react-hot-toast |
| **Backend** | Django 6.0 · Django REST Framework 3.17 · SimpleJWT 5.5 · Gunicorn 23 · WhiteNoise |
| **Database** | PostgreSQL on Neon (SSH-forced, connection pooling, 10-min keep-alive) |
| **AI** | Gemini 2.5 Flash / 2.5 Flash-Lite via REST (`generativelanguage.googleapis.com`) |
| **Validation** | Pydantic ≥ 2.0 schema validation with macro-tolerance checks |
| **Deployment** | Render (backend, `render.yaml` + `build.sh`) · Vercel (frontend, `vercel.json` SPA rewrites) |
| **CI/CD** | GitHub Actions |

---

## 🏗️ Architecture Highlights

### TDEE Engine (`backend/meals/meal_generator.py`)

- **BMR** via the Mifflin-St Jeor equations (gender-specific coefficients) — **5 activity multipliers** (1.2 → 1.725) derived from the user's daily health/exercise minutes with tighter, calorie-realism-aware boundaries.
- **Goal adjustment** of ±300 / −600 kcal, plus a **beverage-calorie deduction** (tea/coffee habits mapped to kcal) before the daily meal budget is split across breakfast/lunch/dinner.
- **Protein targets** scale with body weight (1.2–1.8 g/kg, +0.1 for age > 40), **fat ceilings** are per-goal (55 g vs 85 g/day), and **fasting days** get ingredient-constrained meals using only fasting-safe foods.

### AI Reliability & Fallback Chain

- Every generation path — meal plans, per-day regeneration, cheat-meal image/text analysis, and training plans — uses a **2-model fallback chain** (`gemini-2.5-flash-lite` with 2 attempts → `gemini-2.5-flash` with 1 attempt), retrying with escalating backoff.
- Raw model output is cleaned (markdown fences stripped, JSON extracted), then **validated with Pydantic schemas** that enforce macro arithmetic within a ±25 kcal tolerance before anything touches the database.
- For cheat meals, if the model fails or returns invalid JSON, a **keyword-heuristic fallback** (biryani, pizza, samosa, etc.) still returns a usable low-confidence estimate instead of erroring out.

### Cheat Meal Loop (`backend/cheat_meals/`)

1. Log via **image** (base64-inlined Gemini multimodal request) or **text**.
2. AI may request **one clarifying follow-up question** before committing an estimate (2-round Q&A).
3. Estimate is scored for **confidence** and classified as **small / medium / large**.
4. `apply_cheat_meal_adjustment` spreads the deficit across the next **2 / 4 / 7 upcoming days**, appends a reduction note to each day's `day_notes`, marks days as `adjusted`, and **flags the grocery list for refresh**.

### Performance Optimizations

- **Bulk inserts** — `MealSlot.objects.bulk_create()` replaces one-by-one writes per plan (~78% fewer DB ops).
- **Batch endpoints** — `/api/meals/batch/?dates=...` and `/api/training/days-range/` return multiple days in a single request, killing N+1 HTTP calls.
- **Background work** — grocery list generation runs on a daemon thread after plan creation so the API responds instantly.
- **Query + DB tuning** — `select_related`/`prefetch_related`, dedicated performance-index migrations, persistent DB connections (`CONN_MAX_AGE=600`, health checks), gzip compression, pagination, and skeleton loaders across pages.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+ and a virtual environment
- Node.js 18+ and npm
- A free [Google AI Studio](https://aistudio.google.com/) API key for Gemini
- (Optional) A Neon PostgreSQL database — the app also runs against local Postgres with the same env vars

### 1 · Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows — on macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` from the template:

```bash
cp .env.example .env         # Windows: copy .env.example .env
```

Required environment variables (see `backend/.env.example` and `backend/core/settings.py`):

| Variable | Description |
| --- | --- |
| `SECRET_KEY` | Django secret key (required — app refuses to start without it) |
| `DJANGO_ENV` | `development` or `production` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection (Neon works out of the box via `sslmode=require`) |
| `GEMINI_API_KEY` | Google AI Studio key for plan/training/cheat-meal generation |
| `ALLOWED_HOSTS` | Comma-separated hosts (add your Render URL in production) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (defaults to `http://localhost:5173`) |
| `DJANGO_ADMIN_URL` | Admin path (defaults to `admin`) |

Apply migrations, seed the food database, and start the dev server:

```bash
python manage.py migrate
python manage.py seed_food
python manage.py runserver
```

The API is served at `http://127.0.0.1:8000/`, with the admin at `http://127.0.0.1:8000/admin/`.

### 2 · Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.development` (or copy `frontend/.env.example`):

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Start the Vite dev server:

```bash
npm run dev
```

Open `http://localhost:5173`, create an account, complete the 6-step onboarding, and generate your first plan.

### 3 · Useful Scripts

| Command | Purpose |
| --- | --- |
| `python manage.py test` | Backend test suite |
| `python manage.py seed_food` | Seed the food-item database |
| `npm run build` | Production frontend build (output to `frontend/dist`) |
| `npm run lint` | ESLint over the frontend |
| `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120` | Production backend start (as used in `render.yaml`) |

### 4 · Production Deployment

- **Backend (Render):** add the env vars above, set the build command to `./build.sh` (installs deps, collects static files, migrates) and the start command to the gunicorn line from `backend/render.yaml`. Set `DJANGO_ENV=production` and point `DB_HOST` at your Neon connection string.
- **Frontend (Vercel):** import `frontend/`, set `VITE_API_BASE_URL` to your Render URL (`https://your-backend.onrender.com/api`), and let `vercel.json` handle SPA rewrites. Production builds are in `frontend/dist/`.

---

## 📁 Project Structure

```
DietPlanner/
├── assets/                          # Screenshots used in this README
├── backend/                         # Django REST API
│   ├── core/                        # Project settings, URLs, middleware
│   │   ├── settings.py              # Env-driven config, Neon/SSL, security headers
│   │   ├── urls.py                  # /api/ routing + health check
│   │   ├── cache_middleware.py      # Custom HTTP middleware
│   │   └── media_serve.py           # Auth-protected media serving
│   ├── users/                       # Auth + onboarding (JWT register/login, profile)
│   ├── meals/                       # Weekly plans, day meals, Gemini generation
│   │   └── management/commands/seed_food.py
│   ├── cheat_meals/                 # Image/text AI analysis + calorie adjustment
│   ├── grocery/                     # Aggregated grocery lists
│   ├── training/                    # Weekly training plan generation
│   ├── media/                       # User-uploaded images (cheat meals)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── build.sh
│   └── render.yaml
└── frontend/                        # React SPA (Vite)
    ├── src/
    │   ├── pages/                   # Route-level screens
    │   │   ├── auth/                # Login, Signup, Onboarding
    │   │   ├── dashboard/           # Dashboard
    │   │   ├── nutrition/           # Nutrition, NutritionDetail, CheatMeal
    │   │   ├── training/            # Training
    │   │   └── account/             # Account & settings
    │   ├── components/              # Reusable UI (onboarding steps, macro flower,
    │   │   │                        # cooking loader, cards, modals)
    │   ├── context/                 # AuthContext (JWT state)
    │   ├── hooks/                   # useMealCache, useMealFetch, useCountUp, ...
    │   ├── services/                # API layers per domain (auth, meals, grocery, ...)
    │   ├── utils/                   # Constants, validation, PDF export, caching
    │   ├── assets/                  # Hero image, animated backgrounds, video
    │   └── styles/                  # Theme, glass, animation CSS
    ├── package.json
    ├── vite.config.js               # Dev server, chunk splitting, build opts
    ├── vercel.json                  # SPA rewrites for Vercel
    └── .env.example
```

---

## 📄 License

This project is currently **unlicensed**. A permissive **MIT License** is recommended before publishing — adding an `LICENSE` file at the repo root is a one-line change:

```text
MIT License

Copyright (c) 2026 Om Tailor
```

---

## 👤 Author

Built by [Om Tailor](https://github.com/Omtailor). Check out the live demo at [https://diet-planner-three-sable.vercel.app/login](https://diet-planner-three-sable.vercel.app/login).
