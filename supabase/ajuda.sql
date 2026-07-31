-- Registo do chat de ajuda (aditivo — NÃO apaga nada).
-- Serve para os limites diários e para veres o que andam a perguntar.

create table if not exists help_log (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  question    text not null,
  created_at  timestamptz not null default now()
);

create index if not exists help_log_created_idx on help_log (created_at desc);
