-- ============================================================================
-- FSRS Flashcard App - Supabase Schema
-- ============================================================================
-- Compatible with: ts-fsrs v5.x
-- Last Updated: January 2026
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',  -- For UI card color
  is_public BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,  -- Denormalized for performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table with complete FSRS v5 state
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  
  -- Content fields (Markdown supported)
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- =========================================================================
  -- FSRS v5 State Fields
  -- These fields store the complete state needed by ts-fsrs
  -- =========================================================================
  
  -- Current state of the card
  -- 0 = New (never reviewed)
  -- 1 = Learning (in initial learning phase)
  -- 2 = Review (graduated to review queue)
  -- 3 = Relearning (failed a review, back in learning)
  state SMALLINT NOT NULL DEFAULT 0,
  
  -- Stability: Time interval (in days) for retrievability to decay from 100% to 90%
  -- Higher = memory is more stable, longer intervals
  stability DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  -- Difficulty: Inherent difficulty of the card (1.0 to 10.0)
  -- Higher = harder to remember
  difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
  
  -- Elapsed days since last review
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  
  -- Scheduled interval (in days) assigned at last review
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  
  -- Current learning step index
  learning_steps INTEGER NOT NULL DEFAULT 0,
  
  -- Number of successful reviews (reps)
  reps INTEGER NOT NULL DEFAULT 0,
  
  -- Number of times the card was forgotten (lapses)
  lapses INTEGER NOT NULL DEFAULT 0,
  
  -- When the card is due for review
  due TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- When the card was last reviewed (NULL if never reviewed)
  last_review TIMESTAMPTZ,
  
  -- =========================================================================
  -- Metadata
  -- =========================================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review logs for analytics and potential FSRS parameter optimization
CREATE TABLE review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  
  -- The rating given by the user
  -- 1 = Again (complete failure)
  -- 2 = Hard (recalled with difficulty)
  -- 3 = Good (recalled correctly)
  -- 4 = Easy (recalled effortlessly)
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4),
  
  -- Card state BEFORE this review
  state SMALLINT NOT NULL,
  
  -- Days elapsed since previous review (at time of this review)
  elapsed_days INTEGER NOT NULL,
  
  -- Scheduled interval that was assigned (at time of this review)
  scheduled_days INTEGER NOT NULL,
  
  -- Learning step index (at time of this review)
  learning_steps INTEGER NOT NULL,
  
  -- Duration of the review in milliseconds (optional, for analytics)
  duration_ms INTEGER,
  
  -- When this review occurred
  review_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query: Get due cards for a deck
CREATE INDEX idx_cards_deck_due ON cards(deck_id, due);

-- Alternative: Get all due cards across all decks (for user-wide study)
CREATE INDEX idx_cards_user_due ON cards(deck_id, due) 
  INCLUDE (state, front, back);

-- Filter out new cards when fetching review queue
CREATE INDEX idx_cards_due_review ON cards(due) 
  WHERE state != 0;

-- Review log queries (for analytics)
CREATE INDEX idx_review_logs_card ON review_logs(card_id, review_at DESC);
CREATE INDEX idx_review_logs_time ON review_logs(review_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update deck card count when cards change
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Maintain card count on decks
CREATE TRIGGER maintain_deck_card_count
  AFTER INSERT OR DELETE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Decks: Users can manage their own decks, view public decks
CREATE POLICY "Users can manage own decks"
  ON decks FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public decks"
  ON decks FOR SELECT
  USING (is_public = TRUE);

-- Cards: Users can manage cards in their own decks
CREATE POLICY "Users can manage cards in own decks"
  ON cards FOR ALL
  USING (
    deck_id IN (
      SELECT id FROM decks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view cards in public decks"
  ON cards FOR SELECT
  USING (
    deck_id IN (
      SELECT id FROM decks WHERE is_public = TRUE
    )
  );

-- Review logs: Users can manage logs for their own cards
CREATE POLICY "Users can manage own review logs"
  ON review_logs FOR ALL
  USING (
    card_id IN (
      SELECT c.id FROM cards c
      JOIN decks d ON c.deck_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- ============================================================================
-- INITIAL DATA (Optional)
-- ============================================================================

-- Create a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
