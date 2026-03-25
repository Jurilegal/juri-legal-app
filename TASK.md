# Juri Legal - Build Task

## Overview
Build a professional On-Demand lawyer platform (SaaS) using Next.js 15 App Router + Supabase + Tailwind CSS v4. The platform connects clients with lawyers on a per-minute billing basis.

## Corporate Identity (from juri-legal.com)
- **Primary color:** Deep navy/dark blue (#1B2A4A or similar)
- **Accent color:** Gold/amber (#D4A843 or similar)  
- **Style:** Professional, trustworthy, modern legal platform
- **Font:** Use Inter or similar modern sans-serif
- **Language:** German (primary UI language)
- **Brand name:** Juri Legal

## Tech Stack
- Next.js 15+ (App Router, TypeScript, `src/` directory)
- Supabase (Auth, PostgreSQL with RLS, Storage, Realtime)
- Tailwind CSS v4 (already installed)
- @supabase/supabase-js + @supabase/ssr

## Environment Variables (already set)
```
NEXT_PUBLIC_SUPABASE_URL=https://wpqamxodqbrpyvaybgrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## What to Build

### 1. Supabase Client Setup
- Create `src/lib/supabase/client.ts` (browser client)
- Create `src/lib/supabase/server.ts` (server client with cookies)
- Create `src/lib/supabase/middleware.ts` (auth middleware)
- Install: `npm install @supabase/supabase-js @supabase/ssr`

### 2. Database Schema (via Supabase SQL)
Create a file `supabase/schema.sql` with ALL tables:

```sql
-- Enable RLS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- User profiles (extends Supabase auth.users)
CREATE TYPE user_role AS ENUM ('mandant', 'anwalt', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('anwaltszulassung', 'identitaetsnachweis');
CREATE TYPE document_status AS ENUM ('pending_review', 'approved', 'rejected');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'mandant',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(256) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline VARCHAR(255),
  bio TEXT,
  city VARCHAR(100),
  minute_rate DECIMAL(10,2) DEFAULT 2.99,
  specializations JSONB DEFAULT '[]',
  languages JSONB DEFAULT '["Deutsch"]',
  experience_years INTEGER,
  verification_status verification_status DEFAULT 'pending',
  is_available BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lawyer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  status document_status DEFAULT 'pending_review',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_documents ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, anyone can read lawyer profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view profiles" ON profiles FOR SELECT USING (true);

-- Lawyer profiles: public read, owner write
CREATE POLICY "Public can view lawyer profiles" ON lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "Lawyers can update own profile" ON lawyer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Lawyers can insert own profile" ON lawyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents: owner only
CREATE POLICY "Users can view own documents" ON lawyer_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload documents" ON lawyer_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mandant'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- If lawyer, also create lawyer_profile
  IF (NEW.raw_user_meta_data->>'role') = 'anwalt' THEN
    INSERT INTO lawyer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 3. Auth Pages (German UI)
All pages must look STUNNING and professional. Use the navy/gold color scheme.

- `src/app/(auth)/login/page.tsx` - Login with email/password
- `src/app/(auth)/register/page.tsx` - Registration choice (Mandant or Anwalt)
- `src/app/(auth)/register/mandant/page.tsx` - Client registration
- `src/app/(auth)/register/anwalt/page.tsx` - Lawyer registration (more fields)
- `src/app/(auth)/verify-email/page.tsx` - Email verification page
- `src/app/(auth)/layout.tsx` - Auth layout (centered card, logo, branding)

Registration fields for Anwalt:
- Vorname, Nachname, Email, Passwort (min 12 chars, 1 upper, 1 lower, 1 number, 1 special), AGB checkbox

Registration fields for Mandant:
- Vorname, Nachname, Email, Passwort, AGB checkbox

### 4. Middleware & Route Protection
- `src/middleware.ts` - Protect dashboard routes, redirect unauthenticated users
- Protected routes: `/dashboard/*`, `/anwalt/*`, `/mandant/*`, `/admin/*`
- Public routes: `/`, `/login`, `/register/*`, `/anwaelte/*`, `/verify-email`

### 5. Dashboard Pages
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar
- `src/app/(dashboard)/anwalt/dashboard/page.tsx` - Lawyer dashboard
- `src/app/(dashboard)/anwalt/profil/page.tsx` - Lawyer profile editor
- `src/app/(dashboard)/mandant/dashboard/page.tsx` - Client dashboard
- `src/app/(dashboard)/admin/dashboard/page.tsx` - Admin dashboard
- `src/app/(dashboard)/admin/verifizierung/page.tsx` - Admin verification queue

### 6. Landing Page (CRITICAL - Must be 10M€ quality)
`src/app/page.tsx` - The main landing page must be SPECTACULAR:

- **Hero section:** Bold headline "Sofortige Rechtsberatung. Per Minute." with CTA buttons
- **How it works:** 3-step process (Anwalt finden → Beratung starten → Per Minute bezahlen)
- **Benefits section:** Why Juri Legal (transparent pricing, verified lawyers, instant access)
- **Lawyer showcase:** Featured lawyers with ratings and specializations
- **Pricing section:** Clear per-minute pricing model
- **Trust signals:** Security badges, encryption, Datenschutz
- **FAQ section:** Common questions
- **Footer:** Links, legal, social media
- Use smooth animations, gradients, glass-morphism effects
- Must be fully responsive (mobile-first)

### 7. Public Lawyer Directory
- `src/app/anwaelte/page.tsx` - Searchable lawyer directory with filters
- `src/app/anwaelte/[id]/page.tsx` - Public lawyer profile page
- Filters: Fachgebiet, Stadt, Preis, Verfügbarkeit, Bewertung

### 8. Shared Components
Create in `src/components/`:
- `ui/Button.tsx` - Primary, secondary, outline variants
- `ui/Input.tsx` - Form input with label and error
- `ui/Card.tsx` - Card component
- `ui/Badge.tsx` - Status badges
- `ui/Avatar.tsx` - User avatar
- `layout/Navbar.tsx` - Main navigation (responsive)
- `layout/Footer.tsx` - Site footer
- `layout/Sidebar.tsx` - Dashboard sidebar
- `layout/Logo.tsx` - Juri Legal logo (SVG or text-based)

### 9. Important Notes
- ALL text in German
- Use TypeScript strictly (no `any`)
- Use Server Components where possible, Client Components only when needed
- Every page must be production-quality design
- Mobile-responsive everything
- Use Supabase Auth (email/password) — NOT custom JWT
- Do NOT use any external UI libraries (no shadcn, no MUI) — build everything with Tailwind
- The design must match a 10M€ investment startup look
- Use proper SEO meta tags on all public pages
- Implement proper error handling and loading states

### 10. After Building
1. Run `npm run build` to verify no errors
2. Commit all changes
3. Push to GitHub (the Vercel deploy is automatic)

Git remote is already configured (see .git/config)

When completely finished, run this command to notify me:
openclaw system event --text "Done: Built Juri Legal app - Auth, Landing Page, Lawyer Directory, Dashboards all complete and deployed" --mode now
