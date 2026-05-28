-- ─────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- Custom types
-- ─────────────────────────────────────────────
create type sport_type as enum ('running', 'cycling', 'swimming');
create type race_status as enum ('draft', 'published', 'closed');
create type payment_status as enum ('pending', 'paid', 'refunded');
create type laterality as enum ('left', 'right');
create type gender as enum ('male', 'female', 'non_binary', 'prefer_not_to_say');

-- ─────────────────────────────────────────────
-- organizers
-- ─────────────────────────────────────────────
create table organizers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  created_at  timestamptz not null default now(),
  unique (user_id)
);

alter table organizers enable row level security;

create policy "organizers: own row only"
  on organizers
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- races
-- ─────────────────────────────────────────────
create table races (
  id               uuid primary key default uuid_generate_v4(),
  organizer_id     uuid not null references organizers(id) on delete cascade,
  name             text not null,
  date             date not null,
  location         text not null,
  distance         numeric(10, 2) not null,           -- in km
  sport_type       sport_type not null,
  price            numeric(10, 2) not null default 0,
  max_participants integer not null,
  has_waves        boolean not null default false,
  wave_options     jsonb not null default '[]'::jsonb, -- string[]
  shirt_sizes      jsonb not null default '[]'::jsonb, -- string[]
  status           race_status not null default 'draft',
  created_at       timestamptz not null default now()
);

alter table races enable row level security;

-- Organizers manage only their own races
create policy "races: organizer full access"
  on races
  for all
  using  (organizer_id in (select id from organizers where user_id = auth.uid()))
  with check (organizer_id in (select id from organizers where user_id = auth.uid()));

-- Any authenticated user can read published races
create policy "races: anyone reads published"
  on races
  for select
  using (status = 'published');

-- ─────────────────────────────────────────────
-- athletes
-- ─────────────────────────────────────────────
create table athletes (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  first_name               text not null,
  last_name                text not null,
  email                    text not null,
  phone                    text,
  date_of_birth            date not null,
  nationality              text,
  gender                   gender,
  sport_types              sport_type[] not null default '{}',
  emergency_contact_name   text,
  emergency_contact_phone  text,
  beneficiary_name         text,
  beneficiary_relationship text,
  laterality               laterality,
  created_at               timestamptz not null default now(),
  unique (user_id)
);

alter table athletes enable row level security;

create policy "athletes: own row only"
  on athletes
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Organizers can read athlete info for their race registrations
create policy "athletes: organizer read via registration"
  on athletes
  for select
  using (
    id in (
      select r.athlete_id
      from   registrations r
      join   races rc on rc.id = r.race_id
      join   organizers o on o.id = rc.organizer_id
      where  o.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- registrations
-- ─────────────────────────────────────────────
create table registrations (
  id                      uuid primary key default uuid_generate_v4(),
  race_id                 uuid not null references races(id) on delete cascade,
  athlete_id              uuid not null references athletes(id) on delete cascade,
  wave                    text,
  shirt_size              text,
  expected_finish_time    interval,
  payment_status          payment_status not null default 'pending',
  stripe_payment_intent_id text,
  registered_at           timestamptz not null default now(),
  unique (race_id, athlete_id)
);

alter table registrations enable row level security;

-- Athletes manage only their own registrations
create policy "registrations: athlete full access"
  on registrations
  for all
  using  (athlete_id in (select id from athletes where user_id = auth.uid()))
  with check (athlete_id in (select id from athletes where user_id = auth.uid()));

-- Organizers can read/update registrations for their races
create policy "registrations: organizer read"
  on registrations
  for select
  using (
    race_id in (
      select rc.id
      from   races rc
      join   organizers o on o.id = rc.organizer_id
      where  o.user_id = auth.uid()
    )
  );

create policy "registrations: organizer update"
  on registrations
  for update
  using (
    race_id in (
      select rc.id
      from   races rc
      join   organizers o on o.id = rc.organizer_id
      where  o.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Helpers: prevent over-booking
-- ─────────────────────────────────────────────
create or replace function check_race_capacity()
returns trigger
language plpgsql
security definer
as $$
declare
  v_max   integer;
  v_count integer;
begin
  select max_participants into v_max from races where id = new.race_id;
  select count(*) into v_count
  from   registrations
  where  race_id = new.race_id
    and  payment_status != 'refunded';

  if v_count >= v_max then
    raise exception 'Race is at full capacity (% participants)', v_max;
  end if;
  return new;
end;
$$;

create trigger trg_check_race_capacity
  before insert on registrations
  for each row execute function check_race_capacity();
