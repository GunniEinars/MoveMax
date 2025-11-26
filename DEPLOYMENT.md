# MoveMax Deployment Guide

This guide will walk you through deploying MoveMax to GitHub and setting up Supabase for production.

## 🔑 API Keys Setup (Already Completed)

✅ Your Gemini API key has been configured in `.env.local`

The AI features (scanning, planning, damage assessment) will now work with your API key.

## 📦 GitHub Repository Setup

### Step 1: Create Repository on GitHub

1. Go to [GitHub](https://github.com/new)
2. Repository name: `movemax` (or your preferred name)
3. Description: `AI-powered moving company management system`
4. Choose **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

### Step 2: Push Code to GitHub

After creating the repository, run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/movemax.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

✅ Your code is now backed up on GitHub!

---

## 🗄️ Supabase Setup (Database & Authentication)

### Why Supabase?

Currently, MoveMax stores data in browser memory (mock data). For production, you'll need:
- ✅ Persistent database storage
- ✅ User authentication
- ✅ Real-time updates
- ✅ File storage for images

### Step 1: Create Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Click **New Project**
3. Choose your organization
4. Project name: `movemax`
5. Database password: (generate strong password and save it)
6. Region: Choose closest to your users
7. Click **Create new project** (takes ~2 minutes)

### Step 2: Get API Keys

Once project is created:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

### Step 3: Configure Environment Variables

Add to your `.env.local` file:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your_key_here
```

### Step 4: Create Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  avatar_url TEXT,
  hourly_rate DECIMAL(10,2),
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects/Moves table
CREATE TABLE moves (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  customer_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB -- Store all project data as JSON
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES moves(id),
  user_id UUID REFERENCES staff(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - customize for your needs)
CREATE POLICY "Users can view their company data" ON companies
  FOR SELECT USING (auth.uid() IN (SELECT id FROM staff WHERE company_id = companies.id));

CREATE POLICY "Staff can view company staff" ON staff
  FOR SELECT USING (company_id IN (SELECT company_id FROM staff WHERE id = auth.uid()));

CREATE POLICY "Staff can view company moves" ON moves
  FOR SELECT USING (company_id IN (SELECT company_id FROM staff WHERE id = auth.uid()));

CREATE POLICY "Staff can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### Step 5: Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** authentication
3. Configure email templates (optional)
4. Add redirect URLs for your domain

### Step 6: Update Application Code

You'll need to integrate Supabase SDK. I can help with this next! The key changes:

- Replace `StoreContext` with Supabase queries
- Add authentication flow
- Update all CRUD operations to use Supabase

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for React)

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Option 2: Netlify

1. Go to [Netlify](https://netlify.com)
2. Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy!

### Option 3: Custom Server

Build and serve the production bundle:

```bash
npm run build
# Serve the 'dist' folder with any static file server
```

---

## ✅ Next Steps

1. **GitHub**: Create repository and push code (instructions above)
2. **Supabase**: Create project and configure database (instructions above)
3. **Integration**: Let me know when ready, and I'll help integrate Supabase into the app
4. **Deployment**: Choose a hosting platform and deploy

Need help with any of these steps? Just ask!
