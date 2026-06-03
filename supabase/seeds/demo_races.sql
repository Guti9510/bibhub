-- ── BibHub Demo Race Seed ────────────────────────────────────────────────────
--
-- Creates two events:
--   1. 20 Millas Costa Rica — August 23, 2026  (1 distance)
--   2. Tamarindo             — September 5, 2026 (4 distances)
--
-- Prerequisites:
--   • Migration 004_events.sql must be applied first.
--   • At least one organizer must exist in the DB.
--
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  org_id       uuid;
  evt_millas   uuid;
  evt_tamarindo uuid;
BEGIN

  SELECT id INTO org_id FROM organizers ORDER BY created_at LIMIT 1;
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'No organizer found. Sign up as an organizer first.';
  END IF;

  -- ── Event: 20 Millas ───────────────────────────────────────────────────────
  INSERT INTO events (organizer_id, name, date, location, sport_type, status)
  VALUES (
    org_id,
    '20 Millas Costa Rica',
    '2026-08-23',
    'Cartago, Costa Rica',
    'running',
    'published'
  )
  RETURNING id INTO evt_millas;

  INSERT INTO races (organizer_id, event_id, name, date, location, sport_type, distance, price, max_participants, has_waves, wave_options, shirt_sizes, status)
  VALUES (
    org_id, evt_millas,
    '20 Millas Costa Rica',
    '2026-08-23T05:00:00',
    'Cartago, Costa Rica',
    'running', 32.19, 35.00, 800,
    false, '[]'::jsonb, '["XS","S","M","L","XL","XXL"]'::jsonb, 'published'
  );

  -- ── Event: Tamarindo ───────────────────────────────────────────────────────
  INSERT INTO events (organizer_id, name, date, location, sport_type, status)
  VALUES (
    org_id,
    'Tamarindo',
    '2026-09-05',
    'Tamarindo, Guanacaste, Costa Rica',
    'running',
    'published'
  )
  RETURNING id INTO evt_tamarindo;

  -- 5K
  INSERT INTO races (organizer_id, event_id, name, date, location, sport_type, distance, price, max_participants, has_waves, wave_options, shirt_sizes, status)
  VALUES (
    org_id, evt_tamarindo,
    'Tamarindo 5K',
    '2026-09-05T05:30:00',
    'Tamarindo, Guanacaste, Costa Rica',
    'running', 5, 20.00, 300,
    false, '[]'::jsonb, '["XS","S","M","L","XL","XXL"]'::jsonb, 'published'
  );

  -- 10K
  INSERT INTO races (organizer_id, event_id, name, date, location, sport_type, distance, price, max_participants, has_waves, wave_options, shirt_sizes, status)
  VALUES (
    org_id, evt_tamarindo,
    'Tamarindo 10K',
    '2026-09-05T05:30:00',
    'Tamarindo, Guanacaste, Costa Rica',
    'running', 10, 25.00, 400,
    false, '[]'::jsonb, '["XS","S","M","L","XL","XXL"]'::jsonb, 'published'
  );

  -- 21K
  INSERT INTO races (organizer_id, event_id, name, date, location, sport_type, distance, price, max_participants, has_waves, wave_options, shirt_sizes, status)
  VALUES (
    org_id, evt_tamarindo,
    'Tamarindo Media Maratón',
    '2026-09-05T05:00:00',
    'Tamarindo, Guanacaste, Costa Rica',
    'running', 21.1, 35.00, 500,
    false, '[]'::jsonb, '["XS","S","M","L","XL","XXL"]'::jsonb, 'published'
  );

  -- Maratón
  INSERT INTO races (organizer_id, event_id, name, date, location, sport_type, distance, price, max_participants, has_waves, wave_options, shirt_sizes, status)
  VALUES (
    org_id, evt_tamarindo,
    'Tamarindo Maratón',
    '2026-09-05T04:00:00',
    'Tamarindo, Guanacaste, Costa Rica',
    'running', 42.2, 50.00, 300,
    false, '[]'::jsonb, '["XS","S","M","L","XL","XXL"]'::jsonb, 'published'
  );

  RAISE NOTICE 'Seeded 2 events and 5 races using organizer %', org_id;
END $$;
