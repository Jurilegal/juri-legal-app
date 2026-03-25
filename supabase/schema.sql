-- Juri Legal Database Schema
-- Run this in Supabase SQL Editor

-- Custom types
CREATE TYPE user_role AS ENUM ('mandant', 'anwalt', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('anwaltszulassung', 'identitaetsnachweis');
CREATE TYPE document_status AS ENUM ('pending_review', 'approved', 'rejected');

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'mandant',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(256) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer-specific profile data
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  headline VARCHAR(255),
  bio TEXT,
  city VARCHAR(100),
  minute_rate DECIMAL(10,2) DEFAULT 2.99,
  specializations JSONB DEFAULT '[]',
  languages JSONB DEFAULT '["Deutsch"]',
  experience_years INTEGER,
  verification_status verification_status DEFAULT 'pending',
  is_available BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lawyer verification documents
CREATE TABLE lawyer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type document_type NOT NULL,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  status document_status DEFAULT 'pending_review',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- RLS Policies for lawyer_profiles
CREATE POLICY "Public can view lawyer profiles" ON lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "Lawyers can update own profile" ON lawyer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Lawyers can insert own profile" ON lawyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for lawyer_documents
CREATE POLICY "Users can view own documents" ON lawyer_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload documents" ON lawyer_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON lawyer_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'mandant'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  IF (NEW.raw_user_meta_data->>'role') = 'anwalt' THEN
    INSERT INTO lawyer_profiles (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lawyer_profiles_updated_at BEFORE UPDATE ON lawyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
