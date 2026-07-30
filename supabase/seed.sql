-- Taça do Gerês — seed. Cola tudo no SQL Editor do Supabase e corre.
-- Gerado por scripts/make-seed-sql.mjs — APAGA os dados existentes.

delete from guesses;
delete from answers;
delete from score_events;
delete from approvals;
delete from accusations;
delete from assignments;
delete from moments;
update game_state set active_round_id = null where id = 1;
delete from rounds;
delete from prompts;
delete from missions;
delete from game_state;
delete from players;
delete from teams;

insert into teams (id, name, colour_hex) values
  ('65c5247f-8a8b-4b90-ae16-8894e4ea85cb', 'Lontras do Rio', '#FF3D7F'),
  ('4ff68ef3-2173-464a-bb5f-90c0e3272054', 'Javalis da Serra', '#3AA76D');

-- team_id fica NULL: o sorteio das equipas é feito ao vivo (/admin → TV)
insert into players (id, name, short_name, emoji, team_id) values
  ('e9fda893-d7b6-46b6-aef8-94148aa71960', 'José', 'José', '🦦', null),
  ('1482932f-7297-4b2a-b5d3-131f4827afb4', 'Joana M.', 'Joana M', '🌻', null),
  ('a3452c8c-7d5b-46cf-9416-d2d946486d4b', 'Maria', 'Maria', '🦋', null),
  ('2d9e6aee-d013-4d1d-98c7-bda9ff7aa56f', 'Cristian', 'Cristian', '🌶️', null),
  ('7cc9fc15-19d0-440c-a89f-a7c1c1c5b012', 'Gil', 'Gil', '🍺', null),
  ('87cd1c38-e632-4311-985b-aa66a8181e4a', 'Maike', 'Maike', '🎸', null),
  ('a1fb27ac-cac2-4868-9f68-75412fee2daf', 'Falcão', 'Falcão', '🦅', null),
  ('c248df18-d3b0-4c2b-826a-e2157b845f5a', 'Ana', 'Ana', '🌊', null),
  ('a4cc0bf0-896a-49b3-8927-c134a7452028', 'Joana C.', 'Joana C', '🍀', null),
  ('fc8a0f61-2e3f-4c58-bfa9-834bb7a64dc3', 'João D.', 'João D', '🎣', null);

insert into missions (id, text, points, difficulty, active) values
  ('f5d1f367-6c4c-4be0-bd00-4dd52fece697', 'Consegue que alguém diga a palavra «inflação» em voz alta.', 10, 1, true),
  ('aade802b-31c6-4153-a466-7f9294c29502', 'Convence duas pessoas de que já conheceste um jogador famoso.', 15, 2, true),
  ('200e73f5-9b7c-42c7-a6aa-44ebfaadf661', 'Faz com que outra pessoa te encha o copo sem tu pedires.', 10, 1, true),
  ('eb4efee9-e57c-426a-b0d7-89e53086d9a0', 'Consegue que alguém te tire uma fotografia a fingir que é para o Instagram.', 10, 1, true),
  ('cbc790e4-16a9-46ac-af81-1d06bcdea080', 'Mete a palavra «lontra» em três conversas diferentes.', 10, 1, true),
  ('72acc669-067d-4be7-8ba2-0aed867be96e', 'Convence alguém a ir ver contigo uma coisa que não existe.', 15, 2, true),
  ('b439bbd4-2cba-4bae-adbc-edfabf12e779', 'Consegue que alguém te empreste os óculos de sol.', 10, 1, true),
  ('b716ec8e-cdb2-400b-904e-69707b7c8c33', 'Faz um brinde com uma palavra inventada sem ninguém reparar.', 15, 2, true),
  ('af9ec323-4c22-4df6-b553-5dc0a8b5b065', 'Consegue que duas pessoas discutam sobre qual é o melhor caminho para a cascata.', 20, 3, true),
  ('2bb4e6fc-cc2b-457f-acff-8b29769eccd3', 'Usa a palavra «efetivamente» cinco vezes numa refeição.', 10, 1, true),
  ('0e4f8a21-1047-4928-aee0-479113ca7fd2', 'Consegue que alguém cante uma música dos anos 2000.', 10, 1, true),
  ('53849283-b231-496d-9708-9a8c791f8c80', 'Convence alguém de que sabes ler a sina pelas linhas da mão.', 15, 2, true),
  ('cab9d17a-b15e-4417-8574-a142e597238f', 'Troca o lugar de três objetos na casa sem ninguém dar por isso.', 15, 2, true),
  ('602b63b5-fa6b-4d27-b1dc-ad13316b6ae7', 'Consegue que alguém te faça uma massagem nos ombros.', 10, 1, true),
  ('151ef56e-d5c0-40df-8248-09782b4978a7', 'Fica 10 minutos a falar sempre em terceira pessoa.', 15, 2, true),
  ('eb319c51-bf46-4263-a4e5-6f97466c5a98', 'Consegue que alguém repita uma palavra que acabaste de inventar.', 15, 2, true),
  ('bc34992d-febd-439c-a2f4-476dc380ed78', 'Faz com que o grupo inteiro olhe para o céu ao mesmo tempo.', 20, 3, true),
  ('ca3720b1-4060-4cda-9078-4e6a2cf04f5a', 'Consegue que alguém te dê a última rodela de chouriço.', 10, 1, true),
  ('bfc32d3f-7504-473d-8c50-63f9584328a1', 'Convence alguém de que a água do Gerês tem propriedades mágicas.', 10, 1, true),
  ('4a6d256a-d19c-44e0-8b1b-3edd7b39b3b9', 'Elogia o mesmo detalhe da roupa de três pessoas diferentes.', 10, 1, true),
  ('94649599-f54d-4465-b5da-af2b81f631d5', 'Consegue que alguém te explique as regras de um jogo que tu próprio inventaste.', 20, 3, true),
  ('cb9f92d3-eae2-4669-9b79-ae735ab94614', 'Faz com que alguém diga «isso é o que tu pensas».', 15, 2, true),
  ('5b69dbf6-99e2-4ad7-a173-00d8942a5976', 'Consegue que alguém te vá buscar uma bebida ao frigorífico duas vezes.', 15, 2, true),
  ('1370fa27-dcc7-4f0c-bbf4-c9830e4ff24c', 'Mete uma pedra no bolso de alguém sem que dê conta.', 20, 3, true),
  ('cc42c5b5-c019-4d41-95fb-eb70816bd86b', 'Consegue que alguém diga o nome completo de outro dos presentes.', 10, 1, true),
  ('20d262e1-4505-449b-acf7-6dad8999093f', 'Convence alguém de que amanhã vai chover, com argumentos técnicos.', 10, 1, true),
  ('b5342cf2-f345-4054-adbe-a1e299650e0e', 'Consegue que três pessoas te chamem por uma alcunha nova.', 20, 3, true),
  ('2df77e9e-073c-4690-9417-e3d2dc422d26', 'Faz com que alguém te conte um segredo de infância.', 15, 2, true),
  ('22ed12da-390e-4a0f-ae29-b33b38aac1c9', 'Consegue que alguém imite um animal à tua escolha.', 15, 2, true),
  ('9a9cfcf7-70e2-4119-97b5-d1543adeade0', 'Fala durante 5 minutos com sotaque do Porto sem ninguém comentar.', 15, 2, true),
  ('f3f05457-c329-4bb7-bfa2-1ac2dee1c2ec', 'Consegue que alguém te peça desculpa por uma coisa que não fez.', 20, 3, true),
  ('69896824-cf74-47a1-ae06-87bc39c2d01f', 'Faz com que alguém proponha um mergulho na piscina.', 10, 1, true),
  ('1aa3d14a-6b2e-4287-90cb-3b857e67ade5', 'Consegue que alguém diga «não acredito» três vezes na mesma conversa.', 15, 2, true),
  ('7ce08fbc-86b3-48d1-8bd6-53ed92580556', 'Convence alguém a trocar de cadeira contigo ao jantar.', 10, 1, true),
  ('2baa3171-ceb9-4d31-9eb1-aac52d22a48f', 'Consegue que alguém te ensine um passo de dança.', 10, 1, true),
  ('0e87b2e2-fe31-4b5b-89bb-7cfa86ab52eb', 'Faz com que duas pessoas concordem que tens sempre razão.', 20, 3, true),
  ('11e7fc08-91d6-45c0-8f2f-7d9947c81f98', 'Consegue que alguém adivinhe em que ano aconteceu um evento histórico inventado.', 15, 2, true),
  ('ea411fb9-9be8-47c1-a64e-07ed049efff1', 'Mete a frase «como dizia o meu avô» em duas conversas.', 10, 1, true),
  ('0394f178-404d-4dba-ab68-9ea4a13eef61', 'Consegue que alguém partilhe contigo os phones para ouvir uma música.', 10, 1, true),
  ('0e45c438-4ff9-441c-bd92-66474d5dd896', 'Faz com que alguém diga a palavra «pandemia» sem tu a dizeres primeiro.', 15, 2, true);

insert into prompts (text) values
  ('Qual é a coisa mais parva que já fizeste por dinheiro?'),
  ('Qual dos presentes seria o primeiro a ser preso?'),
  ('Qual foi a maior mentira que contaste aos teus pais?'),
  ('Qual é o teu talento mais inútil?'),
  ('O que é que nunca contaste a ninguém deste grupo?'),
  ('Qual é a tua opinião impopular mais forte?'),
  ('Qual foi o teu momento mais embaraçoso em público?'),
  ('Se tivesses de casar com um dos presentes, quem seria?'),
  ('Qual é a coisa mais estranha que já comeste?'),
  ('O que é que farias se ganhasses o Euromilhões amanhã?'),
  ('Qual é o hábito mais nojento que tens escondido?'),
  ('Qual dos presentes sobreviveria menos tempo num apocalipse?');

insert into game_state (id, current_day, camera_player_id, draw_reveal) values
  (1, 1, '1482932f-7297-4b2a-b5d3-131f4827afb4', 0);

-- 3 missões secretas por jogador, dia 1
insert into assignments (player_id, mission_id, day, status) values
  ('e9fda893-d7b6-46b6-aef8-94148aa71960', '94649599-f54d-4465-b5da-af2b81f631d5', 1, 'ativa'),
  ('e9fda893-d7b6-46b6-aef8-94148aa71960', 'b716ec8e-cdb2-400b-904e-69707b7c8c33', 1, 'ativa'),
  ('e9fda893-d7b6-46b6-aef8-94148aa71960', 'cc42c5b5-c019-4d41-95fb-eb70816bd86b', 1, 'ativa'),
  ('1482932f-7297-4b2a-b5d3-131f4827afb4', 'af9ec323-4c22-4df6-b553-5dc0a8b5b065', 1, 'ativa'),
  ('1482932f-7297-4b2a-b5d3-131f4827afb4', '2bb4e6fc-cc2b-457f-acff-8b29769eccd3', 1, 'ativa'),
  ('1482932f-7297-4b2a-b5d3-131f4827afb4', 'cb9f92d3-eae2-4669-9b79-ae735ab94614', 1, 'ativa'),
  ('a3452c8c-7d5b-46cf-9416-d2d946486d4b', 'cbc790e4-16a9-46ac-af81-1d06bcdea080', 1, 'ativa'),
  ('a3452c8c-7d5b-46cf-9416-d2d946486d4b', '4a6d256a-d19c-44e0-8b1b-3edd7b39b3b9', 1, 'ativa'),
  ('a3452c8c-7d5b-46cf-9416-d2d946486d4b', '20d262e1-4505-449b-acf7-6dad8999093f', 1, 'ativa'),
  ('2d9e6aee-d013-4d1d-98c7-bda9ff7aa56f', 'bfc32d3f-7504-473d-8c50-63f9584328a1', 1, 'ativa'),
  ('2d9e6aee-d013-4d1d-98c7-bda9ff7aa56f', '5b69dbf6-99e2-4ad7-a173-00d8942a5976', 1, 'ativa'),
  ('2d9e6aee-d013-4d1d-98c7-bda9ff7aa56f', 'eb4efee9-e57c-426a-b0d7-89e53086d9a0', 1, 'ativa'),
  ('7cc9fc15-19d0-440c-a89f-a7c1c1c5b012', '11e7fc08-91d6-45c0-8f2f-7d9947c81f98', 1, 'ativa'),
  ('7cc9fc15-19d0-440c-a89f-a7c1c1c5b012', '151ef56e-d5c0-40df-8248-09782b4978a7', 1, 'ativa'),
  ('7cc9fc15-19d0-440c-a89f-a7c1c1c5b012', '72acc669-067d-4be7-8ba2-0aed867be96e', 1, 'ativa'),
  ('87cd1c38-e632-4311-985b-aa66a8181e4a', 'b5342cf2-f345-4054-adbe-a1e299650e0e', 1, 'ativa'),
  ('87cd1c38-e632-4311-985b-aa66a8181e4a', 'b439bbd4-2cba-4bae-adbc-edfabf12e779', 1, 'ativa'),
  ('87cd1c38-e632-4311-985b-aa66a8181e4a', '0e4f8a21-1047-4928-aee0-479113ca7fd2', 1, 'ativa'),
  ('a1fb27ac-cac2-4868-9f68-75412fee2daf', '7ce08fbc-86b3-48d1-8bd6-53ed92580556', 1, 'ativa'),
  ('a1fb27ac-cac2-4868-9f68-75412fee2daf', '9a9cfcf7-70e2-4119-97b5-d1543adeade0', 1, 'ativa'),
  ('a1fb27ac-cac2-4868-9f68-75412fee2daf', '22ed12da-390e-4a0f-ae29-b33b38aac1c9', 1, 'ativa'),
  ('c248df18-d3b0-4c2b-826a-e2157b845f5a', '200e73f5-9b7c-42c7-a6aa-44ebfaadf661', 1, 'ativa'),
  ('c248df18-d3b0-4c2b-826a-e2157b845f5a', '2baa3171-ceb9-4d31-9eb1-aac52d22a48f', 1, 'ativa'),
  ('c248df18-d3b0-4c2b-826a-e2157b845f5a', '53849283-b231-496d-9708-9a8c791f8c80', 1, 'ativa'),
  ('a4cc0bf0-896a-49b3-8927-c134a7452028', 'ca3720b1-4060-4cda-9078-4e6a2cf04f5a', 1, 'ativa'),
  ('a4cc0bf0-896a-49b3-8927-c134a7452028', '0394f178-404d-4dba-ab68-9ea4a13eef61', 1, 'ativa'),
  ('a4cc0bf0-896a-49b3-8927-c134a7452028', '1370fa27-dcc7-4f0c-bbf4-c9830e4ff24c', 1, 'ativa'),
  ('fc8a0f61-2e3f-4c58-bfa9-834bb7a64dc3', 'bc34992d-febd-439c-a2f4-476dc380ed78', 1, 'ativa'),
  ('fc8a0f61-2e3f-4c58-bfa9-834bb7a64dc3', '2df77e9e-073c-4690-9417-e3d2dc422d26', 1, 'ativa'),
  ('fc8a0f61-2e3f-4c58-bfa9-834bb7a64dc3', '69896824-cf74-47a1-ae06-87bc39c2d01f', 1, 'ativa');
