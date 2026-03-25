-- Phase 6: Payments & Billing

-- Add Stripe customer ID to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Payment methods
CREATE TABLE payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session payments
CREATE TABLE session_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES consultation_sessions(id) NOT NULL,
  mandant_id UUID REFERENCES auth.users(id) NOT NULL,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_authorized INTEGER, -- cents
  amount_captured INTEGER,   -- cents
  minute_rate INTEGER NOT NULL, -- cents per minute
  duration_seconds INTEGER,
  platform_fee INTEGER,      -- cents (5%)
  status TEXT CHECK (status IN ('authorized','captured','refunded','failed','cancelled')) DEFAULT 'authorized',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add payment reference to consultation_sessions
ALTER TABLE consultation_sessions ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES session_payments(id);

-- RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own payment methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON session_payments
  FOR SELECT USING (auth.uid() = mandant_id OR auth.uid() = anwalt_id);

-- Indexes
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_session_payments_session ON session_payments(session_id);
CREATE INDEX idx_session_payments_mandant ON session_payments(mandant_id);
CREATE INDEX idx_session_payments_anwalt ON session_payments(anwalt_id);
