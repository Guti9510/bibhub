-- ── Events table ──────────────────────────────────────────────────────────────
--
-- An "event" groups multiple race distances under one entry.
-- e.g. "Tamarindo" is one event with 5K / 10K / 21K / Maratón categories.
-- Single-distance races (e.g. "20 Millas") can also be events with one race.
--
-- Existing races are unaffected — event_id is nullable.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id  uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name          text NOT NULL,
  date          date NOT NULL,
  location      text NOT NULL,
  sport_type    text NOT NULL DEFAULT 'running'
                  CHECK (sport_type IN ('running', 'cycling', 'swimming')),
  description   text,
  status        text NOT NULL DEFAULT 'published'
                  CHECK (status IN ('draft', 'published', 'closed')),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can read published events
CREATE POLICY "Public read published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Organizers can manage their own events
CREATE POLICY "Organizers manage own events"
  ON events FOR ALL
  USING (organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()));

-- ── Link races to events ───────────────────────────────────────────────────────
ALTER TABLE races ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;
