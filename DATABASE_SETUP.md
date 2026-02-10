# 🗄️ Database Setup Guide

## Backend Infrastructure Status
✅ **All backend code is ready!**
- Supabase client/server configuration ✅
- Complete database schema ✅  
- API routes for all operations ✅
- Row Level Security (RLS) policies ✅

## 🚀 Quick Setup Steps

### 1. Create Your Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `inventory-management-system`
   - **Database Password**: Create a strong password 
   - **Region**: Choose closest to you
5. Click "Create new project" and wait ~2 minutes

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Anon key** (public) (starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables
Replace the placeholder values in your `.env.local` file:

```env
# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 4. Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql` 
4. Paste into the SQL editor
5. Click **"Run"** to create all tables and data

### 5. Verify Setup
After completing these steps, restart your development server:
```bash
npm run dev
```

Your system will automatically switch from demo mode to full database mode!

## 🔧 Database Features Included

### Tables Created:
- **admins** - User management
- **categories** - Product categories 
- **products** - Product catalog with soft delete
- **stocks** - Inventory tracking
- **transactions** - Buy/sell history
- **activity_logs** - System audit trail

### Pre-loaded Data:
- 7 default product categories
- Auto-updating timestamps
- UUID primary keys
- Proper foreign key relationships

### Security:
- Row Level Security (RLS) enabled
- Authentication-based policies
- Secure API access

## 🔍 Testing Backend Connection

Once configured, test these endpoints:
- `GET /api/categories` - Should return categories
- `GET /api/products` - Should return empty products array
- `GET /api/dashboard` - Should return real statistics

## 🆘 Troubleshooting

**"Failed to connect to database"**
- Check your SUPABASE_URL and ANON_KEY are correct
- Ensure no extra spaces in .env.local
- Restart dev server after changing .env.local

**"Row Level Security policy violation"**  
- Make sure you ran the complete schema.sql
- RLS policies should allow all operations for authenticated users

**"Table doesn't exist"**
- Run the schema.sql script in Supabase SQL Editor
- Check all tables were created successfully

## 📞 Need Help?
The backend is fully configured and ready to go! Just need to connect it to your Supabase project.