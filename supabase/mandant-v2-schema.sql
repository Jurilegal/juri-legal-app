-- Mandanten-Dashboard V2 + Newsletter & Affiliate System
-- Applied: 2026-03-25

-- Extend profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_type text DEFAULT 'private' CHECK (profile_type IN ('private', 'business'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vat_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS juri_coin_balance numeric(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_subscribed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_confirmed_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS newsletter_token text;

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES consultation_sessions(id),
  mandant_id uuid NOT NULL REFERENCES profiles(id),
  anwalt_id uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  requested_amount numeric(10,2) NOT NULL,
  requested_type text DEFAULT 'amount' CHECK (requested_type IN ('amount', 'percent')),
  status text DEFAULT 'open' CHECK (status IN ('open','forwarded_to_lawyer','lawyer_accepted','lawyer_declined','admin_review','resolved_refund','resolved_rejected')),
  timeline jsonb DEFAULT '[]'::jsonb,
  lawyer_token text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Newsletters
CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  content_html text,
  template_id text,
  segment text NOT NULL CHECK (segment IN ('b2c', 'b2b')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  sent_at timestamptz,
  sent_count integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  product_image text,
  product_description text,
  partner text,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid REFERENCES affiliate_links(id),
  user_id uuid REFERENCES profiles(id),
  email text,
  newsletter_id uuid REFERENCES newsletters(id),
  amount numeric(10,2),
  created_at timestamptz DEFAULT now()
);

-- Link Tracking
CREATE TABLE IF NOT EXISTS link_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid REFERENCES newsletters(id),
  user_id uuid REFERENCES profiles(id),
  url text NOT NULL,
  affiliate_link_id uuid REFERENCES affiliate_links(id),
  clicked_at timestamptz DEFAULT now()
);

-- Juri Coin Ledger
CREATE TABLE IF NOT EXISTS juri_coin_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  amount numeric(10,2) NOT NULL,
  reason text NOT NULL,
  reference_id text,
  created_at timestamptz DEFAULT now()
);

-- Invoice Requests
CREATE TABLE IF NOT EXISTS invoice_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  session_ids jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'sent')),
  pdf_path text,
  created_at timestamptz DEFAULT now()
);
