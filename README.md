# Inventory Management System

Electronics & Mobile Parts Shop — Admin Only

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon database account (free tier available)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Neon Database

1. Create a new project at [neon.tech](https://neon.tech)
2. Copy your connection string from the dashboard
3. The database tables will be created automatically on first run

### 3. Configure environment

Copy `.env.local.example` to `.env.local` and add your Neon connection string:

```
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default login credentials:**

- Username: `admin`
- Password: `admin123`

## 🗄️ Database

- **Production:** Neon (PostgreSQL)
- **Demo Mode:** In-memory data store (when `NEON_DATABASE_URL` is not set)

See [NEON_DATABASE_SETUP.md](NEON_DATABASE_SETUP.md) for detailed setup instructions.

## 🏗 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Neon (PostgreSQL)
- **Auth:** Simple cookie-based authentication
- **Deployment:** Vercel

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/          # Protected admin pages
│   │   ├── dashboard/    # Dashboard overview
│   │   ├── products/     # Products + Recovery
│   │   ├── stock/        # Stock management
│   │   ├── categories/   # Category management
│   │   ├── transactions/ # Transaction history
│   │   ├── reports/      # Reports & analytics
│   │   ├── alerts/       # Stock alerts
│   │   └── logs/         # Activity logs
│   ├── api/              # API routes
│   ├── login/            # Login page
│   └── layout.tsx        # Root layout
├── components/
│   ├── layout/           # Sidebar, Header, AdminLayout
│   └── ui/               # Modal, Badge, Pagination, etc.
├── lib/
│   ├── neon.ts           # Neon database client
│   ├── auth.ts           # Authentication helpers
│   ├── demo-data.ts      # Demo mode data store
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas
├── types/                # TypeScript types
└── middleware.ts          # Auth middleware
```

## 🔐 Features

- Admin-only access with cookie-based authentication
- Dashboard with stats, alerts, recent transactions
- Category management (create, edit, disable)
- Product management with soft delete & recovery
- Stock management with color-coded status
- Automatic transaction logging
- Reports (daily, monthly, custom range)
- Low stock & out of stock alerts
- Activity logs for all admin actions
- Dark mode UI matching Figma design
- Demo mode for testing without database

## 🚀 Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel
4. Auto-deploy on every commit
