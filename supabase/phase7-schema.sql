-- Phase 7: Reviews

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES consultation_sessions(id) NOT NULL UNIQUE,
  mandant_id UUID REFERENCES auth.users(id) NOT NULL,
  anwalt_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Mandant can create review for own session" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = mandant_id AND
    EXISTS (SELECT 1 FROM consultation_sessions WHERE id = session_id AND mandant_id = auth.uid() AND status = 'completed')
  );

CREATE INDEX idx_reviews_anwalt ON reviews(anwalt_id);
CREATE INDEX idx_reviews_session ON reviews(session_id);

-- Function to update lawyer aggregate ratings
CREATE OR REPLACE FUNCTION update_lawyer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lawyer_profiles SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE anwalt_id = NEW.anwalt_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE anwalt_id = NEW.anwalt_id)
  WHERE user_id = NEW.anwalt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_lawyer_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_lawyer_rating();
