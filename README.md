# SpendTrack — Expense Tracker

A full-stack personal finance app with React frontend and Node.js/Express backend. No database installation required — data is stored in a local JSON file via lowdb.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![DB](https://img.shields.io/badge/Database-lowdb%20(JSON%20file)-orange)

## Features

### Core Tracking
- **JWT Authentication** — secure signup/login, tokens stored in localStorage
- **Expense & Income Tracking** — categorized entries with icons (Food, Transport, Bills, Salary, etc.)
- **Monthly Budget** — set a total budget, track spending with a live progress bar
- **Month Navigation** — browse any past month with `‹ ›` controls
- **Recurring Transactions** — mark entries as recurring and they auto-appear every month

### New Features
- **Edit Transactions** — click ✏ on any entry to open an edit form and update any field
- **Import CSV** — upload a `.csv` file to batch-import transactions (Date, Description, Category, Type, Amount, Recurring)
- **CSV Export** — download all transactions as a spreadsheet
- **Spending Insights** — month-over-month comparison per category with % change indicators
- **Category Budgets** — set a spending limit per category (Food, Transport, etc.) with a progress bar per category
- **In-app Help Guide** — "? Help" button with step-by-step instructions for every feature

### Dashboard
- **Stats** — total spent, total income, net balance, avg. daily spending
- **Donut Chart** — visual spending breakdown by category
- **6-Month Bar Chart** — spending trend over the last 6 months
- **Search & Filter** — filter by expense/income/recurring, search by name or category

## Tech Stack

| Layer     | Technology                               |
|-----------|------------------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios   |
| Backend   | Node.js, Express.js                      |
| Database  | **lowdb v1** (JSON file, no install needed) |
| Auth      | JWT, bcryptjs                            |

## Project Structure

```
expense-tracker/
├── backend/
│   ├── db.js              # lowdb setup → db.json (auto-created)
│   ├── routes/
│   │   ├── auth.js        # POST /signup, POST /login
│   │   └── entries.js     # CRUD entries + budget + category budgets
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   └── DashboardPage.jsx
        ├── components/
        │   └── Navbar.jsx
        └── App.jsx
```

## Getting Started

### Prerequisites

- Node.js 18+ (no database software required)

### 1. Backend

```bash
cd backend
npm install
npm start
```

Runs on **http://localhost:5001**. A `db.json` file is created automatically on first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api` requests to the backend on port `5001`.

### Default `.env`

```env
JWT_SECRET=spendtrack-secret
PORT=5001
```

## API Endpoints

| Method | Endpoint                       | Description                        | Auth |
|--------|--------------------------------|------------------------------------|------|
| POST   | `/api/auth/signup`             | Create account, returns JWT        | No   |
| POST   | `/api/auth/login`              | Login, returns JWT                 | No   |
| GET    | `/api/entries`                 | Get all entries + budget info      | Yes  |
| POST   | `/api/entries`                 | Add a new entry                    | Yes  |
| PUT    | `/api/entries/:id`             | Edit an existing entry             | Yes  |
| DELETE | `/api/entries/:id`             | Delete one entry                   | Yes  |
| DELETE | `/api/entries`                 | Clear all entries                  | Yes  |
| PUT    | `/api/entries/budget`          | Update monthly budget              | Yes  |
| PUT    | `/api/entries/category-budget` | Update per-category budgets        | Yes  |

## Categories

**Expenses:** Food · Transport · Shopping · Bills · Health · Entertainment · Education · Other

**Income:** Salary · Freelance · Investment · Gift

## CSV Import Format

Your CSV file should have these columns (header row required):

```
Date,Description,Category,Type,Amount,Recurring
2024-01-15,Groceries,Food,expense,2500,false
2024-01-01,Salary,Salary,income,50000,true
```

## Author

**Anisa Mahmood** — CS Student, University of Gujrat
