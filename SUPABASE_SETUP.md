# Supabase Setup Guide

Your Supabase credentials are now configured! Here's what's set up and what's next.

## ✅ What's Configured

Your `.env.local` file now contains:
- ✅ Gemini API Key (for AI features)
- ✅ Supabase Project URL
- ✅ Supabase Anon Key

## 🗄️ Next Steps: Set Up Database Tables

Your Supabase project is connected but needs database tables. Follow these steps:

### 1. Go to SQL Editor

1. Open your Supabase project: https://app.supabase.com
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run This SQL Script

Copy and paste this entire script, then click **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Crew', 'Driver')),
  avatar_url TEXT,
  hourly_rate DECIMAL(10,2),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects/Moves table
CREATE TABLE moves (
  id TEXT PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
  value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB -- Store all project data as JSON for flexibility
);

-- Activity logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT REFERENCES moves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_staff_company ON staff(company_id);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_moves_company ON moves(company_id);
CREATE INDEX idx_moves_date ON moves(date);
CREATE INDEX idx_moves_status ON moves(status);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allows all operations for now - customize later)
-- Companies policies
CREATE POLICY "Enable all for companies" ON companies FOR ALL USING (true) WITH CHECK (true);

-- Staff policies
CREATE POLICY "Enable all for staff" ON staff FOR ALL USING (true) WITH CHECK (true);

-- Moves policies
CREATE POLICY "Enable all for moves" ON moves FOR ALL USING (true) WITH CHECK (true);

-- Activity logs policies
CREATE POLICY "Enable all for activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert a demo company
INSERT INTO companies (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Moving Company');

-- Insert demo staff
INSERT INTO staff (id, company_id, email, name, phone, role, hourly_rate, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@movemax.com', 'Admin User', '555-0100', 'Admin', 50.00, 'Active'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'manager@movemax.com', 'Project Manager', '555-0101', 'Manager', 35.00, 'Active'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'crew@movemax.com', 'Crew Member', '555-0102', 'Crew', 25.00, 'Active');
```

### 3. Verify Tables Created

After running the script:
1. Go to **Table Editor** in the left sidebar
2. You should see: `companies`, `staff`, `moves`, `activity_logs`

## 🔐 Enable Authentication (Optional)

If you want user login:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Add your app URL to **Redirect URLs**

## 🔌 Integrating Supabase into the App

Currently, MoveMax uses mock data stored in browser memory. To integrate Supabase:

### What Needs to Change:

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Supabase Client** (`services/supabaseClient.ts`)
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. **Replace StoreContext with Supabase Queries**
   - `addMove()` → `supabase.from('moves').insert()`
   - `updateMove()` → `supabase.from('moves').update()`
   - `deleteMove()` → `supabase.from('moves').delete()`
   - Add real-time subscriptions for live updates

4. **Add Authentication**
   - Replace mock login with `supabase.auth.signIn()`
   - Use `supabase.auth.getSession()` for current user

## 📊 Current Status

- ✅ Supabase project created
- ✅ API credentials configured
- ⏳ Database tables (run SQL script above)
- ⏳ Supabase client integration (future enhancement)
- ⏳ Replace mock data with real queries (future enhancement)

## 🚀 Running the App

Your app is ready to run with current mock data:

```bash
npm run dev
```

Visit: http://localhost:3000

The app works fully with mock data. Supabase integration can be added incrementally as needed.

## 🔒 Security Notes

- ✅ `.env.local` is gitignored (secrets are safe)
- ✅ Row Level Security (RLS) enabled on all tables
- ⚠️ Current policies allow all operations (customize for production)
- ⚠️ Add proper authentication before deploying publicly

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

Need help integrating Supabase? Let me know and I can help update the code!
