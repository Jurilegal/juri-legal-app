-- Phase 5: Consultation Sessions & Chat

-- Consultation sessions table
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

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lawyer availability columns
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
CREATE INDEX idx_sessions_status ON consultation_sessions(status);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_messages_created ON chat_messages(session_id, created_at);
CREATE INDEX idx_lawyer_availability ON lawyer_profiles(availability_status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_consultation_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultation_session_updated_at
  BEFORE UPDATE ON consultation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_consultation_session_updated_at();
