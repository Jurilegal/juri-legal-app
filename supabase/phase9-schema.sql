-- Phase 8 & 9: Payout periods, invoices, free minutes

-- Payout periods (monthly billing for lawyers)
CREATE TABLE payout_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount INTEGER DEFAULT 0,
  platform_fee INTEGER DEFAULT 0,
  net_amount INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending','accepted','invoice_requested','paid','disputed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lawyer invoices
CREATE TABLE lawyer_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_period_id UUID REFERENCES payout_periods(id) NOT NULL,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  file_path TEXT,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Free minutes ledger
CREATE TABLE free_minutes_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  reason TEXT NOT NULL,
  reference_id UUID, -- session_id or review_id etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add free minutes balance view
CREATE OR REPLACE FUNCTION get_free_minutes_balance(uid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER FROM free_minutes_ledger WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS
ALTER TABLE payout_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_minutes_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anwalt can view own payouts" ON payout_periods FOR SELECT USING (auth.uid() = anwalt_id);
CREATE POLICY "Anwalt can update own payouts" ON payout_periods FOR UPDATE USING (auth.uid() = anwalt_id);
CREATE POLICY "Admin can manage payouts" ON payout_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anwalt can view own invoices" ON lawyer_invoices FOR SELECT USING (auth.uid() = anwalt_id);
CREATE POLICY "Anwalt can manage own invoices" ON lawyer_invoices FOR ALL USING (auth.uid() = anwalt_id);
CREATE POLICY "Admin can manage invoices" ON lawyer_invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view own free minutes" ON free_minutes_ledger FOR SELECT USING (auth.uid() = user_id);

-- Grant 5 free minutes on registration (trigger)
CREATE OR REPLACE FUNCTION grant_registration_free_minutes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'mandant' THEN
    INSERT INTO free_minutes_ledger (user_id, amount, reason)
    VALUES (NEW.id, 5, 'Willkommensbonus bei Registrierung');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_registration_free_minutes
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION grant_registration_free_minutes();

-- Grant 2 free minutes per review
CREATE OR REPLACE FUNCTION grant_review_free_minutes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO free_minutes_ledger (user_id, amount, reason, reference_id)
  VALUES (NEW.mandant_id, 2, 'Bewertung abgegeben', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_review_free_minutes
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION grant_review_free_minutes();

-- Indexes
CREATE INDEX idx_payout_periods_anwalt ON payout_periods(anwalt_id);
CREATE INDEX idx_lawyer_invoices_payout ON lawyer_invoices(payout_period_id);
CREATE INDEX idx_free_minutes_user ON free_minutes_ledger(user_id);
