-- Votação de eventos nos telemóveis (aditivo — NÃO apaga nada).
-- Cola no SQL Editor do Supabase e corre uma vez.

create table if not exists event_votes (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id),
  voter_id    uuid not null references players(id),
  target_id   uuid not null references players(id),
  created_at  timestamptz not null default now(),
  -- um voto por pessoa por evento (o upsert permite mudar de ideias)
  unique (event_id, voter_id)
);
