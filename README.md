# 🎓 Student Expense Tracker

A full-stack, responsive web application specifically tailored for college and university students to manage everyday expenses, set monthly category budgets, track tuition & book costs, hit savings goals, and automate recurring subscriptions.

---

## 📁 Project Architecture

```
student-expense-tracker/
│
├── client/                     # Frontend Vanilla Web App (HTML5 / CSS3 / JS)
│   ├── index.html              # Landing Page & Product Overview
│   ├── login.html              # Student Authentication (Login)
│   ├── register.html           # Student Registration
│   ├── dashboard.html          # Main Financial Dashboard & Metrics
│   ├── transactions.html       # Transaction Management & CSV Export
│   ├── budgets.html            # Category Budget Limits & Progress Bars
│   ├── analytics.html          # Spending Trends & Doughnut/Line Charts
│   ├── goals.html              # Savings Goals with Fund Contribution
│   ├── recurring.html          # Subscriptions & Recurring Bills
│   ├── settings.html           # User Profile & Preferences
│   │
│   ├── assets/
│   │   └── icons/              # Static Icons & Assets
│   │
│   ├── css/
│   │   ├── variables.css       # Theme Tokens, Colors, Radii & Spacing
│   │   ├── base.css            # Reset, Typography & Utility Classes
│   │   ├── layout.css          # Navigation Sidebar & Application Shell
│   │   ├── components.css      # Cards, Buttons, Modals, Tables & Badges
│   │   ├── dashboard.css       # Dashboard Grids, Chart Wrappers & Tips
│   │   └── responsive.css      # Mobile & Tablet Breakpoints
│   │
│   └── js/
│       ├── config.js           # API Host, Storage Keys & Config
│       ├── api.js              # Fetch Wrapper with Auth Headers
│       ├── auth.js             # Session & Profile Management
│       ├── guards.js           # Client-side Route Protection
│       ├── dashboard.js        # Overview Charts & Summary Loading
│       ├── transactions.js     # Transaction Filters, Search & CRUD
│       ├── budgets.js          # Monthly Budget Progress & Warnings
│       ├── analytics.js        # Trend Curves & Category Breakdown
│       ├── goals.js            # Target Goal Creation & Fund Deposits
│       ├── recurring.js        # Due Date Calculation & Processing
│       ├── validation.js       # Client Validation Helpers
│       └── utils.js            # Currency & Date Formatters, Modals, Toasts
│
├── server/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── app.js              # Express App & Global Middlewares
│   │   ├── server.js           # Server Entry & Port Binding
│   │   ├── config/             # Environment & Supabase Client Config
│   │   ├── middleware/         # Auth, Zod Validation, Error Handling
│   │   ├── routes/             # REST Endpoints (Auth, Tx, Budgets, Goals, etc.)
│   │   ├── controllers/        # Request Handlers & Status Codes
│   │   ├── services/           # Database Logic & Calculations
│   │   ├── schemas/            # Zod Validation Schemas
│   │   └── utils/              # Standard JSON Response & Logger
│   ├── tests/                  # Backend Smoke & Integration Tests
│   ├── package.json            # Server Dependencies
│   └── .env.example            # Backend Environment Variables
│
├── supabase/                   # Database & Migrations
│   ├── config.toml             # Local Supabase CLI Configuration
│   ├── migrations/
│   │   └── 001_initial_schema.sql # PostgreSQL Tables, Triggers & RLS
│   └── seed.sql                # Default Student Categories Seed Data
│
├── .gitignore
├── README.md
└── package.json                # Root package runner
```

---

## ⚡ Quick Start Guide

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the SQL statements inside `supabase/migrations/001_initial_schema.sql`.
4. Run `supabase/seed.sql` to populate default student categories (Tuition, Food, Books, Rent, Transport, etc.).

### 2. Configure Server Environment
In `server/`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Install & Start Server
```bash
cd server
npm install
npm run dev
```
The API will run on `http://localhost:5000/api`.

### 4. Run Frontend Client
You can serve the `client/` folder using any static server:
```bash
# Using Python
python -m http.server 3000 --directory client

# Or using npx serve
npx serve client -l 3000
```
Open `http://localhost:3000` in your web browser.

---

## 🛡️ Security & Features
- **JWT Authentication**: User sessions verified via Supabase Auth with scoped access.
- **PostgreSQL Row Level Security (RLS)**: Enforces data isolation between students.
- **Budget Alerts**: Visual warnings when spending exceeds 75% and 100% of category limits.
- **CSV Export**: One-click download of all transactions for spreadsheets.
- **Interactive Visualizations**: Powered by Chart.js.

