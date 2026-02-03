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

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
-- Note: This is a public kiosk application with no user authentication.
-- RLS policies are designed to prevent accidental data corruption while
-- allowing the concierge system to function properly.

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- PACKAGES POLICIES
-- Allow reading all packages (for checking status)
CREATE POLICY "Allow read packages" ON packages
  FOR SELECT USING (true);

-- Allow inserting new packages (when deliveries arrive)
CREATE POLICY "Allow insert packages" ON packages
  FOR INSERT WITH CHECK (true);

-- Allow updating package status (for pickup confirmation)
CREATE POLICY "Allow update packages" ON packages
  FOR UPDATE USING (true)
  WITH CHECK (status IN ('pending', 'picked_up'));

-- Prevent deletion of packages (audit trail)
CREATE POLICY "Prevent delete packages" ON packages
  FOR DELETE USING (false);

-- BOOKINGS POLICIES
-- Allow reading all bookings (to check availability)
CREATE POLICY "Allow read bookings" ON bookings
  FOR SELECT USING (true);

-- Allow creating new bookings
CREATE POLICY "Allow insert bookings" ON bookings
  FOR INSERT WITH CHECK (
    booking_time > NOW() AND  -- Only future bookings
    booking_time < NOW() + INTERVAL '30 days'  -- Max 30 days ahead
  );

-- Prevent updates and deletes (bookings are immutable once created)
CREATE POLICY "Prevent update bookings" ON bookings
  FOR UPDATE USING (false);

CREATE POLICY "Prevent delete bookings" ON bookings
  FOR DELETE USING (false);

-- CONVERSATIONS POLICIES
-- Allow reading recent conversations (for context retrieval)
CREATE POLICY "Allow read recent conversations" ON conversations
  FOR SELECT USING (created_at > NOW() - INTERVAL '7 days');

-- Allow creating new conversation records
CREATE POLICY "Allow insert conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Prevent updates and deletes (conversations are append-only)
CREATE POLICY "Prevent update conversations" ON conversations
  FOR UPDATE USING (false);

CREATE POLICY "Prevent delete conversations" ON conversations
  FOR DELETE USING (false);
