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
