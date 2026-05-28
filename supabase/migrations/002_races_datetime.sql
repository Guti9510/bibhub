-- Change races.date from date → timestamptz so start time can be stored.
-- Existing rows get midnight UTC for the stored date.
alter table races
  alter column date type timestamptz
  using (date::timestamptz);
