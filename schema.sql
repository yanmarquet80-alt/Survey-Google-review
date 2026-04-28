-- ============================================================
-- Google Reviews Solicitation — Schema SQL
-- Préfixe `review_` pour cohabitation propre avec d'autres produits
-- À appliquer sur un projet Supabase (public schema)
-- ============================================================

-- 1. Établissements clients (un par professionnel utilisateur du SaaS)
create table if not exists review_businesses (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              text not null default 'other',
  -- valeurs: restaurant | hotel | health | beauty | retail | other
  google_review_url text not null,
  tripadvisor_url   text,
  trustpilot_url    text,
  yelp_url          text,  -- portail Yelp Biz (réponse uniquement, pas de sollicitation - CGU)
  thefork_url       text,  -- portail TheFork Manager (réponse uniquement, sollicitation auto par TheFork)
  platform_priority text default 'google',
  owner_email       text not null,
  config            jsonb not null default '{}',
  -- clés config: smtp_from, reminder_delay_days, email_subject,
  --              email_template, reminder_subject, reminder_template
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Clients finaux (un par client du professionnel)
create table if not exists review_clients (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references review_businesses(id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  created_at  timestamptz not null default now(),
  unique(business_id, email)
);

-- 3. Campagnes (un envoi = une ligne)
create table if not exists review_campaigns (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references review_clients(id) on delete cascade,
  business_id       uuid not null references review_businesses(id) on delete cascade,
  status            text not null default 'pending',
  -- valeurs: pending | sent | reminder_sent | reviewed | expired
  sent_at           timestamptz,
  reminder_at       timestamptz,
  reminder_sent_at  timestamptz,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index critique pour Workflow B (relances)
create index if not exists review_campaigns_reminder_idx
  on review_campaigns(status, reminder_at) where status = 'sent';

-- Index pour filtres dashboard
create index if not exists review_campaigns_business_idx
  on review_campaigns(business_id, status);
