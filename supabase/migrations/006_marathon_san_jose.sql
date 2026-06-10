-- ── Migration 006: Maratón San José demo data + closed-event policies ─────────
--
-- 1. Allow public to read closed events & races (for past-race results pages)
-- 2. Insert Maratón San José 2026 as a closed event with 4 race distances
--
-- Run in Supabase SQL Editor. Requires at least one organizer account to exist.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Public read policies for closed events & races ────────────────────
CREATE POLICY "Public read closed events"
  ON events FOR SELECT
  USING (status = 'closed');

CREATE POLICY "Public read closed races"
  ON races FOR SELECT
  USING (status = 'closed');

-- ── Step 2: Insert demo race ───────────────────────────────────────────────────
DO $$
DECLARE
  v_org_id   uuid;
  v_event_id uuid;
BEGIN
  -- Use the first organizer in the system
  SELECT id INTO v_org_id FROM organizers ORDER BY created_at LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organizer found. Create an organizer account first, then re-run this migration.';
  END IF;

  -- Idempotent: skip if already inserted
  IF EXISTS (SELECT 1 FROM events WHERE name = 'Maratón San José') THEN
    RAISE NOTICE 'Maratón San José already exists — skipping insert.';
    RETURN;
  END IF;

  INSERT INTO events (organizer_id, name, date, location, sport_type, status, description)
  VALUES (
    v_org_id,
    'Maratón San José',
    '2026-06-07',
    'Parque La Sabana, San José, Costa Rica',
    'running',
    'closed',
    'La carrera más importante de Costa Rica. Cuatro distancias para todos los niveles: 5K, 10K, Media Maratón y Maratón.'
  )
  RETURNING id INTO v_event_id;

  INSERT INTO races (organizer_id, name, date, location, distance, sport_type, price, max_participants, status, event_id)
  VALUES
    (v_org_id, 'Maratón San José 5K',    '2026-06-07', 'Parque La Sabana, San José, Costa Rica',  5,    'running', 15, 5000, 'closed', v_event_id),
    (v_org_id, 'Maratón San José 10K',   '2026-06-07', 'Parque La Sabana, San José, Costa Rica', 10,    'running', 20, 4000, 'closed', v_event_id),
    (v_org_id, 'Maratón San José 21K',   '2026-06-07', 'Parque La Sabana, San José, Costa Rica', 21.1,  'running', 35, 3000, 'closed', v_event_id),
    (v_org_id, 'Maratón San José 42K',   '2026-06-07', 'Parque La Sabana, San José, Costa Rica', 42.2,  'running', 55, 2000, 'closed', v_event_id);

  RAISE NOTICE 'Maratón San José inserted with event_id: %', v_event_id;
END $$;
