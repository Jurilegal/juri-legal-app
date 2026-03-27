# NACHT-TASK: Juri Legal Modul-Vervollständigung

Arbeite diese Aufgaben in Reihenfolge ab. Ziel: Alle Module voll funktionsfähig + Dummy-Daten.

## Kontext
- Next.js 15 + Supabase + Tailwind CSS v4
- Projekt: /Users/annaweiss-ea/.openclaw/workspace/juri-legal/app/
- DB: postgresql://postgres:Ay0TNIIG4QdygNuU@db.wpqamxodqbrpyvaybgrj.supabase.co:5432/postgres
- psql: /opt/homebrew/Cellar/libpq/18.3/bin/psql
- Anwalt User ID: 42849bd3-8bd4-4c6a-8d51-b3421b32fd61
- Mandant User ID: b60ce5aa (check profiles table for full UUID)
- Git push pattern: git add -A && git commit -m "msg" && git push && git checkout design-b && git merge main -m "merge: desc" && git push && git checkout main

## Phase 1: Fix broken modules

### 1. KI-Assistent (src/app/(dashboard)/anwalt/kanzlei/ki/page.tsx)
- Build offline-smart KI assistant that works WITHOUT API key
- Template-based responses for common legal queries (Fristen, RVG, Schriftsatz-Muster)
- When GROQ_API_KEY is set in env, use it via /api/anwalt/ki-assistant route
- Update /api/anwalt/ki-assistant/route.ts to support Groq (https://api.groq.com/openai/v1/chat/completions, model: llama-3.3-70b-versatile)
- Chat history in DB table ki_chat_history (create it via psql)
- 10 Vorlagen, Akte-Kontext auswählbar, "Als Notiz speichern" Button
- Markdown rendering for responses

### 2. E-Mail-Client (src/app/(dashboard)/anwalt/kanzlei/email/page.tsx)  
- Remove ALL alert() → inline success/error banners (green/red div that auto-fades)
- Remove "Demo-Modus" text everywhere
- fetchEmails: generate 5-8 realistic emails in DB from courts/mandanten/gegner
- Send: just INSERT into DB, show inline confirmation
- Add attachment_path column to kanzlei_emails (psql)

### 3. DATEV-Export (src/app/(dashboard)/anwalt/kanzlei/datev/page.tsx)
- Complete rewrite (currently 40 lines)
- Date range selector, export type selector
- Load real data from kanzlei_invoices, fibu_entries, invoice_payments
- Generate DATEV-CSV format (semicolon separated, German numbers)
- Preview table + download button

### 4. Recherche (src/app/(dashboard)/anwalt/kanzlei/recherche/page.tsx)
- Remove ALL mock/demo data
- Search over knowledge_base + case_notes from DB
- Law reference generator: parse "§ 823 BGB" → link to gesetze-im-internet.de
- Save search queries in legal_research_queries
- "Zur Akte hinzufügen" button

### 5. Dokument-Viewer (src/app/(dashboard)/anwalt/kanzlei/dokument-viewer/page.tsx)
- Load documents from case_documents
- Create signed URLs from Supabase Storage
- PDF preview in iframe, images in img tag
- Split layout: list left, preview right
- Download button, "Zur Akte" link

### 6. Vorlagen (src/app/(dashboard)/anwalt/kanzlei/vorlagen/page.tsx)
- Remove "wird ergänzt" placeholders
- Define 9 placeholders: MANDANT_NAME, MANDANT_ADRESSE, GEGNER_NAME, AKTENZEICHEN, DATUM, GERICHT, KANZLEI_NAME, KANZLEI_ADRESSE, ANWALT_NAME
- Placeholder click-to-insert in editor
- Live preview with replaced placeholders from selected case
- Generate document from template + case → download

### 7. beA-Postfach (src/app/(dashboard)/anwalt/kanzlei/bea/page.tsx)
- Load messages from bea_messages DB table
- Compose + send (INSERT into DB)
- Inbox/Outbox/Drafts tabs
- Mark as read
- Link to case (case_id)

### 8. Migration (src/app/(dashboard)/anwalt/migration/page.tsx)
- Real CSV upload (file input)
- CSV parsing in browser
- Column mapping UI
- Import into: cases, kanzlei_contacts, kanzlei_clients
- Preview first 5 rows
- Progress indicator
- Template CSV download

### 9. Mandant Zahlungen (src/app/(dashboard)/mandant/zahlungen/page.tsx)
- Connect to Supabase: load from session_payments, juri_coin_ledger
- Remove alert()
- Payment history list
- Filter by time period
- Summary cards (total spent, this month)

### 10. Mandant Coins (src/app/(dashboard)/mandant/coins/page.tsx)
- Remove alert() → inline feedback
- Load balance from juri_coin_ledger
- Package selection (10€, 25€, 50€, 100€)
- Transaction history from DB

### 11. Replace ALL alert() in entire codebase
- Find all alert() calls in src/app/ and replace with inline UI feedback

## Phase 2: Dummy Data (via psql)
Insert 10-15 realistic German dummy records per module for anwalt user 42849bd3-8bd4-4c6a-8d51-b3421b32fd61:
- 12 cases (diverse Rechtsgebiete, statuses, with sub-cases)
- 15 contacts (all 7 types)
- 10 kanzlei_clients 
- 12 deadlines (3 overdue, 4 upcoming, 5 done)
- 15 time_entries
- 10 invoices (different statuses) + 5 payments
- 12 case_notes
- 10 calendar_events
- 10 text_snippets
- 8 knowledge_base entries
- 12 fibu_entries
- 10 kanzlei_emails
- 5 dunning_processes
- 5 bea_messages
- 8 document_templates
- 5 case_templates
- 6 wiedervorlagen (deadlines with type=wiedervorlage)
- 4 workflow_templates
- 5 claims/forderungen
- 1 complete kanzlei_settings record
- For mandant: 5 beratungen, 5 reviews, coin balance, 6 payments

## Phase 3: Build + Push
- npm run build (must pass with 0 errors)  
- Push to main + design-b
- Clean up test files (qa-test.cjs etc)

## IMPORTANT
- All UI text in GERMAN
- Use Tailwind classes consistent with existing code (navy-*, gold-*)
- All new tables need RLS enabled
- Commit after each major module fix
- German date format (dd.MM.yyyy), German currency (€)
