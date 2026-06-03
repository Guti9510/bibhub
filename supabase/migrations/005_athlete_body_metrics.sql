-- Add approximate height, weight, optional team, and years per sport to athlete profiles
ALTER TABLE athletes
  ADD COLUMN height_cm  numeric(5,1),
  ADD COLUMN weight_kg  numeric(5,1),
  ADD COLUMN team       text,
  ADD COLUMN sport_years jsonb NOT NULL DEFAULT '{}'::jsonb;
  -- e.g. { "running": 5, "cycling": 2 }
