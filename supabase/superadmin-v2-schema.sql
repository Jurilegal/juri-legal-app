-- Super Admin V2: Task Engine, Commission Models, Document Verification History

-- Tasks table (central process engine)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open','in_progress','pending_approval','completed','failed')) DEFAULT 'open' NOT NULL,
  module TEXT CHECK (module IN ('accounts','finance','contracts','hr','marketing')) NOT NULL,
  related_entity_id UUID,
  related_entity_type TEXT, -- 'lawyer', 'mandant', 'contract', 'invoice', 'payout'
  assigned_admin_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Extend lawyer_profiles: commission model + affidavit
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('standard','custom_rate','free_months','free_until_revenue')) DEFAULT 'standard';
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 5.00;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS free_months_count INTEGER DEFAULT 0;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS free_until_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS has_submitted_affidavit BOOLEAN DEFAULT false;
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS docusign_contract_path TEXT;

-- Extend lawyer_documents: verification history + immutable flag
ALTER TABLE lawyer_documents ADD COLUMN IF NOT EXISTS verification_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyer_documents ADD COLUMN IF NOT EXISTS is_immutable BOOLEAN DEFAULT false;
ALTER TABLE lawyer_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add super_admin to user_role enum (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
END$$;

-- RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Prevent deletion of immutable documents
CREATE OR REPLACE FUNCTION prevent_immutable_document_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_immutable = true THEN
    RAISE EXCEPTION 'Genehmigte Dokumente können nicht gelöscht werden';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_immutable_delete
  BEFORE DELETE ON lawyer_documents
  FOR EACH ROW EXECUTE FUNCTION prevent_immutable_document_delete();

-- Auto-create task on lawyer registration (via profile insert)
CREATE OR REPLACE FUNCTION create_lawyer_verification_task()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'anwalt' THEN
    INSERT INTO tasks (title, description, status, module, related_entity_id, related_entity_type)
    VALUES (
      'Dokumente verifizieren: ' || COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''),
      'Neue Anwaltsregistrierung - Dokumente prüfen und Account verifizieren',
      'open', 'accounts', NEW.id, 'lawyer'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_lawyer_task
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_lawyer_verification_task();

-- Auto-create task when contract nears expiry (run via cron or check)
CREATE OR REPLACE FUNCTION check_expiring_contracts()
RETURNS void AS $$
BEGIN
  INSERT INTO tasks (title, description, status, module, related_entity_id, related_entity_type)
  SELECT
    'Vertrag läuft aus: ' || c.partner_name,
    'Vertrag mit ' || c.partner_name || ' läuft am ' || c.end_date || ' aus',
    'open', 'contracts', c.id, 'contract'
  FROM contracts c
  WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM tasks t WHERE t.related_entity_id = c.id AND t.related_entity_type = 'contract' AND t.status != 'completed'
    );
END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-complete lawyer verification task when all docs approved
CREATE OR REPLACE FUNCTION auto_complete_verification_task()
RETURNS TRIGGER AS $$
DECLARE
  all_approved BOOLEAN;
  doc_count INTEGER;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Mark document as immutable
    UPDATE lawyer_documents SET is_immutable = true WHERE id = NEW.id;

    -- Check if ALL documents for this lawyer are now approved
    SELECT COUNT(*) = 0 INTO all_approved
    FROM lawyer_documents
    WHERE user_id = NEW.user_id AND status != 'approved';

    SELECT COUNT(*) INTO doc_count
    FROM lawyer_documents WHERE user_id = NEW.user_id;

    IF all_approved AND doc_count >= 2 THEN
      UPDATE tasks SET status = 'pending_approval', updated_at = now()
      WHERE related_entity_id = NEW.user_id
        AND related_entity_type = 'lawyer'
        AND module = 'accounts'
        AND status IN ('open', 'in_progress');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_complete_verification
  AFTER UPDATE ON lawyer_documents
  FOR EACH ROW EXECUTE FUNCTION auto_complete_verification_task();

-- Indexes
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_module ON tasks(module);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_admin_id);
CREATE INDEX idx_tasks_related ON tasks(related_entity_id, related_entity_type);

-- Updated_at trigger for tasks
CREATE TRIGGER trigger_update_task_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_consultation_session_updated_at();
