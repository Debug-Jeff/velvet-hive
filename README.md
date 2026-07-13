# Velvet Hive

A full-stack supermarket e-commerce platform: a customer storefront plus role-based dashboards.

## Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, react-router-dom
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT, DB-backed RBAC, Google OAuth
- **Payments**: Paystack (cards), Safaricom Daraja (M-Pesa STK Push)
- **Email**: Nodemailer

## Running locally

Requires Node.js 20+ and a PostgreSQL database.

```bash
# Backend
cd server
npm install
cp .env.example .env   
npx prisma migrate dev
npx prisma db seed
cd ..

# Frontend + backend together
npm install
npm run dev:all         # or: npm run dev:split (Windows Terminal split panes)
```

Or with Docker:

```bash
docker compose up --build
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:3001`
