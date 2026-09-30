-- QueueLess Database Schema

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'operator', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('healthcare', 'banking', 'government', 'education', 'utility', 'other')),
  address TEXT,
  city TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  average_service_time_minutes INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Counters
CREATE TABLE IF NOT EXISTS counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_open BOOLEAN DEFAULT TRUE,
  current_operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens (the core queue entity)
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  counter_id UUID REFERENCES counters(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  citizen_name TEXT NOT NULL,
  citizen_phone TEXT,
  citizen_email TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
  position_in_queue INTEGER DEFAULT 1,
  estimated_wait_minutes INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token History / Events (for analytics)
CREATE TABLE IF NOT EXISTS token_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('joined', 'called', 'serving', 'completed', 'skipped', 'cancelled')),
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_tokens_service_status ON tokens(service_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_joined_at ON tokens(joined_at);
CREATE INDEX IF NOT EXISTS idx_counters_service ON counters(service_id);
CREATE INDEX IF NOT EXISTS idx_services_location ON services(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_token_events_token ON token_events(token_id);
