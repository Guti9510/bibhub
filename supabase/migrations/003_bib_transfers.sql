-- ── Bib Transfers ────────────────────────────────────────────────────────────
--
-- A registered athlete can list their bib for transfer (sell, swap, or gift).
-- Another athlete can claim it, transferring ownership of the registration.
--
-- Transfer types:
--   sell  — seller asks a price (paid outside the platform for now)
--   swap  — seller wants to swap bibs with another registered athlete
--   gift  — free transfer, no payment expected
--
-- Status flow:
--   available → claimed   (buyer claimed the bib)
--   available → cancelled (seller cancelled the listing)

CREATE TABLE bib_transfers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id   uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  race_id           uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  seller_id         uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  buyer_id          uuid REFERENCES athletes(id),
  transfer_type     text NOT NULL DEFAULT 'gift'
                      CHECK (transfer_type IN ('sell', 'swap', 'gift')),
  asking_price      numeric(10,2),
  message           text,
  status            text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'claimed', 'cancelled')),
  created_at        timestamptz DEFAULT now(),
  claimed_at        timestamptz
);

-- Only one active listing per registration at a time
CREATE UNIQUE INDEX bib_transfers_active_unique
  ON bib_transfers(registration_id)
  WHERE status = 'available';

ALTER TABLE bib_transfers ENABLE ROW LEVEL SECURITY;

-- Public can read available listings (needed for the race detail page marketplace)
CREATE POLICY "Public read available transfers"
  ON bib_transfers FOR SELECT
  USING (status = 'available');

-- Athletes can read their own transfers (as seller or buyer) regardless of status
CREATE POLICY "Athletes read own transfers"
  ON bib_transfers FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      seller_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()) OR
      buyer_id  IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
  );

-- Only service role (admin client) handles inserts / updates to keep logic server-side
