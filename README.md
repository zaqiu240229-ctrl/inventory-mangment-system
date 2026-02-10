# Inventory Management System

Electronics & Mobile Parts Shop — Admin Only

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Create an admin user in Authentication → Users

### 3. Configure environment
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗 Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Admin only)
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
│   ├── supabase/         # Supabase client/server/middleware
│   ├── utils.ts          # Utility functions
│   └── validations.ts    # Zod schemas qszer
├── types/                # TypeScript types
└── middleware.ts          # Auth middleware
```

## 🔐 Features
- Admin-only access with Supabase Auth
- Dashboard with stats, alerts, recent transactions
- Category management (create, edit, disable)
- Product management with soft delete & recovery
- Stock management with color-coded status
- Automatic transaction logging
- Reports (daily, monthly, custom range)
- Low stock & out of stock alerts
- Activity logs for all admin actions
- Dark mode UI matching Figma design

## 🚀 Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel
4. Auto-deploy on every commit
