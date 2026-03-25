-- Anwalts-Dashboard V2 Schema Extensions
-- Admin notifications for realtime support alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read notifications" ON admin_notifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Authenticated users can insert notifications" ON admin_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Review deletion → admin task trigger
CREATE OR REPLACE FUNCTION create_review_deletion_task()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tasks (title, description, status, module, related_entity_id, related_entity_type)
  VALUES (
    'Bewertungs-Löschantrag',
    'Anwalt ' || NEW.anwalt_id || ' beantragt Löschung der Bewertung ' || NEW.review_id || '. Begründung: ' || COALESCE(NEW.reason, '-'),
    'open', 'accounts', NEW.review_id::text, 'review_deletion'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_review_deletion_task ON review_deletion_requests;
CREATE TRIGGER trigger_review_deletion_task
  AFTER INSERT ON review_deletion_requests FOR EACH ROW
  EXECUTE FUNCTION create_review_deletion_task();
