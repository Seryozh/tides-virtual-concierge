-- ============================================
-- TIDES VIRTUAL CONCIERGE - DATABASE SCHEMA
-- ============================================

-- Table 1: Packages (Already exists)
-- Stores package delivery information
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unit_number TEXT NOT NULL,
  courier TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up'))
);

-- Table 2: Bookings
-- Stores amenity bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unit_number TEXT NOT NULL,
  amenity TEXT NOT NULL,
  booking_time TIMESTAMPTZ NOT NULL
);

-- Table 3: Conversations (NEW)
-- Stores conversation history for continuous context
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  unit_number TEXT,
  messages JSONB NOT NULL,
  CONSTRAINT fk_unit FOREIGN KEY (unit_number) REFERENCES packages(unit_number) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_unit_status ON packages(unit_number, status);
CREATE INDEX IF NOT EXISTS idx_bookings_unit ON bookings(unit_number);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

-- Insert sample data (if not exists)
INSERT INTO packages (unit_number, courier, status) VALUES
  ('101', 'Amazon', 'pending'),
  ('101', 'FedEx', 'pending'),
  ('205', 'DHL', 'picked_up')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS) for production
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (for now)
CREATE POLICY "Allow all operations" ON packages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON conversations FOR ALL USING (true);
