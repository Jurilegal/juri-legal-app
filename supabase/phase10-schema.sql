-- Phase 10: AI Matching with pgvector

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to lawyer_profiles
ALTER TABLE lawyer_profiles ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Similarity search index
CREATE INDEX IF NOT EXISTS idx_lawyer_embedding ON lawyer_profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_lawyers(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  similarity float
) AS $$
  SELECT
    lp.user_id,
    1 - (lp.embedding <=> query_embedding) AS similarity
  FROM lawyer_profiles lp
  WHERE lp.verification_status = 'approved'
    AND lp.embedding IS NOT NULL
    AND 1 - (lp.embedding <=> query_embedding) > match_threshold
  ORDER BY lp.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
