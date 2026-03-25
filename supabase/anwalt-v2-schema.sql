-- Anwalt Dashboard V2 Schema

-- Extend lawyer_profiles
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS minute_rate_video NUMERIC(6,2);
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS minute_rate_chat NUMERIC(6,2);
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS availability_slots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS calendar_absences JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS communication_channels JSONB DEFAULT '["chat","video"]'::jsonb;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS google_calendar_token JSONB;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS country_of_practice TEXT[] DEFAULT ARRAY['DE'];
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS office_country TEXT DEFAULT 'DE';
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 19.00;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS prices_confirmed_at TIMESTAMPTZ;

-- Price history
CREATE TABLE price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  minute_rate_video NUMERIC(6,2),
  minute_rate_chat NUMERIC(6,2),
  confirmed_at TIMESTAMPTZ DEFAULT now()
);

-- Review deletion requests
CREATE TABLE review_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) NOT NULL,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Support tickets
CREATE TABLE support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('open','in_progress','resolved')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Country-specific document requirements
CREATE TABLE document_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  document_type TEXT NOT NULL,
  label_de TEXT NOT NULL,
  label_fr TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT true
);

-- Insert default document requirements
INSERT INTO document_requirements (country_code, document_type, label_de, description) VALUES
  ('DE', 'anwaltszulassung', 'Anwaltszulassung (RAK)', 'Zulassungsurkunde der Rechtsanwaltskammer'),
  ('DE', 'identitaetsnachweis', 'Personalausweis / Reisepass', 'Gültiger Lichtbildausweis'),
  ('DE', 'berufshaftpflicht', 'Berufshaftpflichtversicherung', 'Nachweis der Berufshaftpflichtversicherung'),
  ('FR', 'carte_professionnelle', 'Carte Professionnelle d''Avocat', 'Carte délivrée par le Barreau'),
  ('FR', 'identitaetsnachweis', 'Carte d''identité / Passeport', 'Pièce d''identité valide'),
  ('FR', 'attestation_assurance', 'Attestation d''assurance RCP', 'Responsabilité civile professionnelle'),
  ('IT', 'tessera_ordine', 'Tessera dell''Ordine degli Avvocati', 'Iscrizione all''Albo'),
  ('IT', 'identitaetsnachweis', 'Carta d''identità / Passaporto', 'Documento d''identità valido'),
  ('IT', 'polizza_rc', 'Polizza RC Professionale', 'Assicurazione responsabilità civile');

-- RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view own price history" ON price_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Lawyers can insert price history" ON price_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lawyers can manage own deletion requests" ON review_deletion_requests FOR ALL USING (auth.uid() = anwalt_id);
CREATE POLICY "Admin can manage deletion requests" ON review_deletion_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can manage own tickets" ON support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage tickets" ON support_tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Anyone can read doc requirements" ON document_requirements FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_price_history_user ON price_history(user_id);
CREATE INDEX idx_deletion_requests_review ON review_deletion_requests(review_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_doc_requirements_country ON document_requirements(country_code);

-- Auto-create task on review deletion request
CREATE OR REPLACE FUNCTION create_review_deletion_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tasks (title, description, status, module, related_entity_id, related_entity_type)
  VALUES (
    'Bewertung-Löschantrag prüfen',
    'Anwalt beantragt Löschung einer Bewertung. Begründung: ' || NEW.reason,
    'open', 'accounts', NEW.review_id, 'review_deletion'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_review_deletion_task
  AFTER INSERT ON review_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION create_review_deletion_task();

-- Auto-create task on support ticket
CREATE OR REPLACE FUNCTION create_support_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tasks (title, description, status, module, related_entity_id, related_entity_type)
  VALUES (
    'Support-Anfrage: ' || NEW.subject,
    NEW.message,
    'open', 'accounts', NEW.id, 'support_ticket'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_support_task
  AFTER INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION create_support_task();
