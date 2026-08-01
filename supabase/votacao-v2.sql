-- Votação v2: cada pessoa vota nos seus 3 melhores, por ordem (aditivo).
-- Cola no SQL Editor do Supabase e corre uma vez (DEPOIS do votacao-eventos.sql).

alter table event_votes add column if not exists slot int not null default 1;
alter table event_votes drop constraint if exists event_votes_event_id_voter_id_key;
alter table event_votes drop constraint if exists event_votes_voter_slot;
alter table event_votes add constraint event_votes_voter_slot unique (event_id, voter_id, slot);
alter table event_votes drop constraint if exists event_votes_voter_target;
alter table event_votes add constraint event_votes_voter_target unique (event_id, voter_id, target_id);
