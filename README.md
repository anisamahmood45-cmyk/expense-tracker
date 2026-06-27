# SpendTrack — Expense Tracker

A full-stack personal finance app with React frontend and Node.js/Express/MongoDB backend.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![DB](https://img.shields.io/badge/Database-MongoDB-brightgreen)

## Features

- **JWT Authentication** — secure signup/login, tokens stored in localStorage
- **Expense & Income Tracking** — categorized entries with icons (Food, Transport, Bills, Salary, etc.)
- **Monthly Budget** — set a budget, track spending with a live progress bar
- **Month Navigation** — browse any past month's transactions with `‹ ›` controls
- **Recurring Transactions** — mark entries as recurring and they appear in every month's view automatically
- **Dashboard Stats** — total spent, total income, net balance, biggest expense at a glance
- **Donut Chart** — visual spending breakdown by category
- **6-Month Bar Chart** — spending trend over the last 6 months
- **Search & Filter** — filter by expense/income/recurring, search by name or category
- **CSV Export** — download all transactions as a spreadsheet

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router v6, Axios |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB, Mongoose                 |
| Auth      | JWT, bcryptjs                     |

## Project Structure

```
expense-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js        # username, email, password (hashed), budget
│   │   └── Entry.js       # name, amount, category, type, date, recurring
│   ├── routes/
│   │   ├── auth.js        # POST /signup, POST /login
│   │   └── entries.js     # GET, POST, DELETE /, DELETE /:id, PUT /budget
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

- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Backend

```bash
cd backend
npm install
# Edit .env if needed (default: mongodb://localhost:27017/spendtrack, port 5001)
npm start
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the Vite dev server proxies `/api` requests to the backend on port `5001`.

## API Endpoints

| Method | Endpoint             | Description                  | Auth |
|--------|----------------------|------------------------------|------|
| POST   | `/api/auth/signup`   | Create account, returns JWT  | No   |
| POST   | `/api/auth/login`    | Login, returns JWT           | No   |
| GET    | `/api/entries`       | Get all entries + budget     | Yes  |
| POST   | `/api/entries`       | Add a new entry              | Yes  |
| DELETE | `/api/entries/:id`   | Delete one entry             | Yes  |
| DELETE | `/api/entries`       | Clear all entries            | Yes  |
| PUT    | `/api/entries/budget`| Update monthly budget        | Yes  |

## Categories

**Expenses:** Food · Transport · Shopping · Bills · Health · Entertainment · Education · Other

**Income:** Salary · Freelance · Investment · Gift

## Environment Variables

```env
MONGO_URI=mongodb://localhost:27017/spendtrack
JWT_SECRET=your-secret-key
PORT=5001
```

## Author

**Anisa Mahmood** — CS Student, University of Gujrat
