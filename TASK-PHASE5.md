# Phase 5: Echtzeit-Chat & Verfügbarkeitsstatus

## Tech Stack
- Next.js 15 App Router + TypeScript + Tailwind CSS v4
- Supabase (Auth, Realtime, PostgreSQL)
- Project root: this directory (.)

## Color scheme
- Navy: #1B2A4A (navy-900), lighter shades navy-800 to navy-50
- Gold: #D4A843 (gold-400)
- All UI text in German

## Supabase Config
- URL: https://wpqamxodqbrpyvaybgrj.supabase.co
- Anon key and service role key are in .env.local
- Existing client helpers: src/lib/supabase/client.ts, server.ts, middleware.ts

## Existing Components
- UI: Button, Input, Card, Badge, Avatar (in src/components/ui/)
- Layout: Logo, Navbar, Footer, Sidebar (in src/components/layout/)
- DashboardShell with responsive sidebar (src/app/(dashboard)/DashboardShell.tsx)

## What to Build

### 1. Database Schema (supabase/phase5-schema.sql)
Create SQL file AND a migration note. Tables needed:

```sql
-- Consultation sessions
CREATE TABLE consultation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mandant_id UUID REFERENCES auth.users(id) NOT NULL,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT CHECK (status IN ('requested','accepted','active','completed','declined','cancelled')) DEFAULT 'requested',
  type TEXT CHECK (type IN ('chat','video')) DEFAULT 'chat',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lawyer availability
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('online','busy','offline')) DEFAULT 'offline';
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- RLS
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON consultation_sessions
  FOR SELECT USING (auth.uid() = mandant_id OR auth.uid() = anwalt_id);

CREATE POLICY "Mandant can create sessions" ON consultation_sessions
  FOR INSERT WITH CHECK (auth.uid() = mandant_id);

CREATE POLICY "Participants can update sessions" ON consultation_sessions
  FOR UPDATE USING (auth.uid() = mandant_id OR auth.uid() = anwalt_id);

CREATE POLICY "Session participants can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM consultation_sessions WHERE id = chat_messages.session_id AND (mandant_id = auth.uid() OR anwalt_id = auth.uid()))
  );

CREATE POLICY "Session participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM consultation_sessions WHERE id = chat_messages.session_id AND status = 'active' AND (mandant_id = auth.uid() OR anwalt_id = auth.uid()))
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE consultation_sessions;

-- Indexes
CREATE INDEX idx_sessions_mandant ON consultation_sessions(mandant_id);
CREATE INDEX idx_sessions_anwalt ON consultation_sessions(anwalt_id);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_lawyer_availability ON lawyer_profiles(availability_status);
```

### 2. Availability Toggle (Anwalt Dashboard)
Update src/app/(dashboard)/anwalt/dashboard/page.tsx:
- Add a toggle switch at the top: Online/Offline/Beschäftigt
- When toggled, update lawyer_profiles.availability_status via Supabase
- Show green/yellow/gray dot next to status

### 3. Session Request Flow
Create src/app/anwaelte/[id]/page.tsx updates:
- Add "Beratung anfragen" button on lawyer profile (only for logged-in mandants)
- Button creates a consultation_session with status 'requested'
- Show toast/feedback

### 4. Anwalt Session Notifications
Update anwalt dashboard:
- Show incoming session requests (status='requested') as cards
- "Annehmen" / "Ablehnen" buttons
- Accept → status='active', sets started_at
- Decline → status='declined'

### 5. Chat Room Page
Create src/app/(dashboard)/beratung/[id]/page.tsx:
- Full chat interface with message bubbles (navy for own, lighter for other)
- Real-time messages via Supabase Realtime subscription
- Message input at bottom with send button
- Session timer showing elapsed time
- "Beratung beenden" button → sets status='completed', ended_at, calculates duration_seconds
- Auto-scroll to newest messages

### 6. Active Sessions List
Create src/app/(dashboard)/beratung/page.tsx:
- List all sessions for the current user
- Tabs: Aktiv | Abgeschlossen | Alle
- Click to enter chat room

### 7. Navigation Updates
Update DashboardShell.tsx:
- Add "Beratungen" nav item for both anwalt and mandant
- Anwalt: href='/beratung' with chat icon
- Mandant: href='/beratung' with chat icon

### 8. Dashboard Layout Update
The dashboard layout (src/app/(dashboard)/layout.tsx) needs to allow the /beratung routes.

## Important Notes
- Use existing Supabase client helpers (createClient from @/lib/supabase/client for client components)
- Use createServerClient from @/lib/supabase/server for server components
- Follow existing code style (Tailwind classes, component patterns)
- All text in German
- NO video/WebRTC yet — just chat for now (video comes later)
- The middleware already handles auth — check src/middleware.ts
- Run `npm run build` after all changes to verify

## DO NOT
- Install new packages unless absolutely necessary
- Change existing working components
- Break the build
