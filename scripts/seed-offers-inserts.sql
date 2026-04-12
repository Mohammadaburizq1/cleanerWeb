-- PostgreSQL seed: offers (English) with optional discount percentage.
-- JSON / C# property name: discountPercent (camelCase) ↔ "DiscountPercent" column (PascalCase).
--
-- If the table already exists without this column, run:
--   ALTER TABLE "Offers" ADD COLUMN IF NOT EXISTS "DiscountPercent" double precision NULL;

-- UUID: PostgreSQL 13+ — gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Option A: create table + seed (new database)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Offers" (
  "Id" uuid NOT NULL,
  "Title" character varying(500) NOT NULL,
  "Summary" character varying(2000) NOT NULL,
  "Detail" text NOT NULL,
  "Badge" character varying(200) NULL,
  "DiscountPercent" double precision NULL,
  "SortOrder" integer NOT NULL DEFAULT 0,
  "IsActive" boolean NOT NULL DEFAULT TRUE,
  CONSTRAINT "PK_Offers" PRIMARY KEY ("Id")
);

INSERT INTO "Offers" ("Id", "Title", "Summary", "Detail", "Badge", "DiscountPercent", "SortOrder", "IsActive")
VALUES
(
  gen_random_uuid(),
  'First booking discount',
  'Save on your first standard or deep clean when you book online or by phone.',
  'Mention this offer when you book. Applies to first-time residential customers only; not combinable with other promotions unless stated.',
  'New customers',
  15,
  10,
  TRUE
),
(
  gen_random_uuid(),
  'Deep clean + hourly touch-ups',
  'Pair a deep clean with flexible hourly visits and get a packaged quote.',
  'We build your quote from bedrooms, baths, home size, and add-ons. Ideal after a deep clean for ongoing upkeep.',
  'Bundle',
  10,
  20,
  TRUE
),
(
  gen_random_uuid(),
  'Spring refresh special',
  'Priority scheduling with extra focus on windows and baseboards during peak season.',
  'Available March–May while slots last. Ask when you book; peak weekend surcharges may apply.',
  'Seasonal',
  8,
  30,
  TRUE
),
(
  gen_random_uuid(),
  'Recurring schedule savings',
  'Weekly or bi-weekly plans include a lower per-visit rate than one-time bookings.',
  'Ask for a recurring quote; minimum commitment and cancellation terms apply per agreement.',
  'Ongoing',
  12,
  40,
  TRUE
);
