-- Taça do Gerês — schema
-- Paste this whole file into the Supabase SQL editor and run it once.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- núcleo

create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  colour_hex  text not null
);

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text not null,
  emoji       text not null default '🙂',
  team_id     uuid references teams(id),
  created_at  timestamptz not null default now()
);

-- linha única (id = 1)
-- draw_reveal: quantos jogadores já foram revelados no sorteio de equipas na TV
create table if not exists game_state (
  id                int primary key default 1 check (id = 1),
  current_day       int not null default 1,
  active_round_id   uuid,
  camera_player_id  uuid references players(id),
  draw_reveal       int not null default 0
);

-- para bases de dados criadas antes do sorteio existir
alter table game_state add column if not exists draw_reveal int not null default 0;

-- ---------------------------------------------------- Missões Secretas

create table if not exists missions (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  points      int not null default 10,
  difficulty  int not null default 1 check (difficulty in (1, 2, 3)),
  active      boolean not null default true
);

-- 'expirada' não está na spec mas é preciso um estado para o rollover do dia.
create table if not exists assignments (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  mission_id  uuid not null references missions(id),
  day         int not null,
  status      text not null default 'ativa'
              check (status in ('ativa','reclamada','confirmada','chumbada','apanhada','expirada')),
  created_at  timestamptz not null default now(),
  -- uma missão nunca é dada duas vezes em todo o fim de semana
  unique (mission_id)
);

create table if not exists approvals (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references assignments(id),
  player_id      uuid not null references players(id),
  vote           boolean not null,
  created_at     timestamptz not null default now(),
  unique (assignment_id, player_id)
);

-- slot ∈ {1,2}: garante no máximo 2 acusações por jogador por dia, ao nível da BD
create table if not exists accusations (
  id          uuid primary key default gen_random_uuid(),
  accuser_id  uuid not null references players(id),
  target_id   uuid not null references players(id),
  mission_id  uuid not null references missions(id),
  day         int not null,
  slot        int not null check (slot in (1, 2)),
  correct     boolean not null,
  created_at  timestamptz not null default now(),
  unique (accuser_id, day, slot)
);

-- ---------------------------------------------------- Quem Disse Isto?

-- catálogo de perguntas (semeado a partir de content/prompts.json)
create table if not exists prompts (
  id    uuid primary key default gen_random_uuid(),
  text  text not null,
  used  boolean not null default false
);

-- reveal_index: quantas respostas já foram reveladas na TV
create table if not exists rounds (
  id            uuid primary key default gen_random_uuid(),
  prompt        text not null,
  status        text not null default 'a_responder'
                check (status in ('a_responder','a_adivinhar','revelado')),
  reveal_index  int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists answers (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references rounds(id),
  player_id  uuid not null references players(id),
  text       text not null,
  unique (round_id, player_id)
);

create table if not exists guesses (
  id                 uuid primary key default gen_random_uuid(),
  round_id           uuid not null references rounds(id),
  guesser_id         uuid not null references players(id),
  answer_id          uuid not null references answers(id),
  guessed_player_id  uuid not null references players(id),
  unique (round_id, guesser_id, answer_id)
);

-- ---------------------------------------------------------------- Taça

-- NUNCA guardar totais: o leaderboard é sempre SUM(points) GROUP BY player_id
create table if not exists score_events (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  team_id     uuid references teams(id),
  points      int not null,
  reason      text not null,
  source      text not null check (source in ('missao','acusacao','quem_disse','manual')),
  created_at  timestamptz not null default now()
);

create index if not exists score_events_player_idx on score_events (player_id);
create index if not exists score_events_created_idx on score_events (created_at desc);

create table if not exists moments (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  text        text not null,
  created_at  timestamptz not null default now()
);
-- Eventos anunciados + mural de ideias (aditivo — NÃO apaga nada).
-- Cola no SQL Editor e corre uma vez.

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  when_hint   text,
  status      text not null default 'previsto' check (status in ('previsto','jogado')),
  first_id    uuid references players(id),
  second_id   uuid references players(id),
  third_id    uuid references players(id),
  played_at   timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists ideas (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  kind        text not null check (kind in ('missao','evento','quizz','outro')),
  text        text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now()
);
-- Registo do chat de ajuda (aditivo — NÃO apaga nada).
-- Serve para os limites diários e para veres o que andam a perguntar.

create table if not exists help_log (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id),
  question    text not null,
  created_at  timestamptz not null default now()
);

create index if not exists help_log_created_idx on help_log (created_at desc);
