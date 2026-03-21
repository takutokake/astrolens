-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  categories TEXT[] DEFAULT '{}',
  location TEXT,
  premium_tier TEXT DEFAULT 'free' CHECK (premium_tier IN ('free', 'premium', 'premium_plus')),
  countries TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  keywords TEXT[] DEFAULT '{}',
  max_recency_hours INTEGER DEFAULT 24 CHECK (max_recency_hours BETWEEN 1 AND 72),
  sentiment_mode TEXT DEFAULT 'any' CHECK (sentiment_mode IN ('any', 'positive_only', 'mix')),
  include_local BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  category TEXT,
  source_name TEXT,
  source_id TEXT,
  image_url TEXT,
  article_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  country TEXT,
  language TEXT,
  sentiment TEXT,
  ai_summary TEXT,
  cache_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article cache metadata
CREATE TABLE IF NOT EXISTS article_cache_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  categories TEXT[],
  countries TEXT[],
  languages TEXT[],
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  article_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digests table
CREATE TABLE IF NOT EXISTS digests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL CHECK (duration IN (10, 20, 30)),
  categories TEXT[],
  article_ids UUID[],
  word_count INTEGER,
  audio_url TEXT,
  radio_script TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved articles
CREATE TABLE IF NOT EXISTS saved_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_hash TEXT,
  route TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);

-- User article interactions
CREATE TABLE IF NOT EXISTS user_article_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'save', 'share', 'skip')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, article_id, interaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_cache_key ON articles(cache_key);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_digests_user_id ON digests(user_id);
CREATE INDEX IF NOT EXISTS idx_digests_created_at ON digests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_window ON api_usage(window_start);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_article_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own digests" ON digests;
DROP POLICY IF EXISTS "Users can create own digests" ON digests;
DROP POLICY IF EXISTS "Users can view own saved articles" ON saved_articles;
DROP POLICY IF EXISTS "Users can save articles" ON saved_articles;
DROP POLICY IF EXISTS "Users can delete own saved articles" ON saved_articles;
DROP POLICY IF EXISTS "Users can view own interactions" ON user_article_interactions;
DROP POLICY IF EXISTS "Users can create own interactions" ON user_article_interactions;
DROP POLICY IF EXISTS "Anyone can read articles" ON articles;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own digests" ON digests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own digests" ON digests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own saved articles" ON saved_articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save articles" ON saved_articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved articles" ON saved_articles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON user_article_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own interactions" ON user_article_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for articles (no auth required)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read articles" ON articles FOR SELECT USING (true);

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-digests', 'audio-digests', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy
DROP POLICY IF EXISTS "Users can upload own audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read audio" ON storage.objects;

CREATE POLICY "Users can upload own audio" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'audio-digests' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read audio" ON storage.objects 
FOR SELECT USING (bucket_id = 'audio-digests');
