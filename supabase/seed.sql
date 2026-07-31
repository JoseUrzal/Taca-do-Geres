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
  ('e5be76f5-c153-442a-80b1-5105dcc58359', 'Um Gajo FC', '#4F46E5'),
  ('a21382b9-f51a-4ab3-b92a-45e0f204cde1', 'Que Inferno SC', '#FF6B57');

-- team_id fica NULL: o sorteio das equipas é feito ao vivo (/admin → TV)
insert into players (id, name, short_name, emoji, team_id) values
  ('d88bad53-898c-4f07-a732-63548f209789', 'José', 'José', '🦦', null),
  ('be79dea3-70b2-4418-b77d-1e60f1514160', 'Joana M.', 'Joana M', '🌻', null),
  ('18f74891-189d-4fc8-9851-c3b923b3fcd5', 'Maria', 'Maria', '🦋', null),
  ('88145f95-c015-4afa-84f2-ad2f4f365501', 'Cristian', 'Cristian', '🌶️', null),
  ('28e19b8a-4972-4dbc-be74-2f5e8d09a06a', 'Gil', 'Gil', '🍺', null),
  ('75fd3271-9e65-49c5-8183-5dfed661075c', 'Maike', 'Maike', '🎸', null),
  ('f9afead4-47af-4156-adaa-aa5f4743faa1', 'Falcão', 'Falcão', '🦅', null),
  ('f5cdda6a-bb53-462e-8c07-a8d210397774', 'Ana', 'Ana', '🌊', null),
  ('eff6439f-94ca-4d59-83dc-5669f19ffbbb', 'Joana C.', 'Joana C', '🍀', null),
  ('4115d653-3446-449e-a71a-9c152bd25ade', 'João D.', 'João D', '🎣', null);

insert into missions (id, text, points, difficulty, active) values
  ('1eb888ee-5b41-40f9-bba1-262789765f96', 'Faz com que alguém diga «Que inferno!» sem seres tu a dizê-lo primeiro.', 15, 2, true),
  ('cf40e3f3-07ae-4c1d-ad05-c405e19c4376', 'Faz com que alguém diga «um gajo…» numa frase.', 10, 1, true),
  ('94fc0e0d-15a6-4e23-b61e-5f59c0e37606', 'Bebe um copo inteiro com o dedo indicador dentro do copo, à Melo, sem ninguém comentar.', 15, 2, true),
  ('98847708-3489-4aa2-90ba-4d5b9507eddb', 'Roça o dedo no tecido da roupa de três pessoas diferentes, à José.', 15, 2, true),
  ('931bb976-2b80-43b5-8199-11482ae58fd4', 'Consegue que alguém te explique como se ganha o Masterchef.', 10, 1, true),
  ('5802f537-5bde-46df-ac44-32b29f285ee0', 'Convence alguém de que o Real Madrid está de olho num jogador que acabaste de inventar.', 15, 2, true),
  ('f8b226ee-95e9-4124-b088-456fe87d2e65', 'Faz com que alguém diga «palhaços aqui a bater».', 15, 2, true),
  ('91d1d365-a20b-4331-b999-ddbb20cd2a76', 'Mete a palavra «sustentabilidade» em três conversas diferentes.', 15, 2, true),
  ('1d35bae1-dd55-4edd-9ae4-1a1114028685', 'Consegue que alguém te recomende uma compra na Zara.', 10, 1, true),
  ('e3cd599c-1b78-4f14-9453-7f3331ffe9f6', 'Faz com que alguém conte uma história das férias de La Manga.', 10, 1, true),
  ('811a8c55-eae0-4cb3-a89b-0ca170d4271d', 'Convence alguém de que a Liga vai aprovar uma regra nova absurda no futebol.', 15, 2, true),
  ('b676d731-8efc-40b7-8f76-3f0385a6d7a6', 'Consegue que alguém corrija a maneira como puseste a louça na máquina.', 15, 2, true),
  ('7ea9d155-c030-4a95-8226-23705991fafc', 'Consegue que alguém te desenhe a planta de uma divisão da casa.', 15, 2, true),
  ('fb6760b4-8e96-4f69-9974-5717c09813fe', 'Faz com que alguém diga os nomes dos três bebés do grupo de seguida.', 10, 1, true),
  ('2b17a004-19d5-4c83-be0a-3a79b7875966', 'Convence alguém de que em criança ganhaste um concurso de karaoke.', 15, 2, true),
  ('dd9f5eb6-9f90-4c45-80ff-c478655d943a', 'Corrige a geografia de alguém com confiança total, mesmo sem teres a certeza.', 10, 1, true),
  ('2591c18d-95f6-47df-bda6-daf8a0bace64', 'Consegue que alguém avalie o teu empratamento como um jurado do Masterchef.', 15, 2, true),
  ('0934f2eb-8df6-4a2d-95a3-b2930ba512d9', 'Faz com que outra pessoa te encha o copo sem tu pedires.', 10, 1, true),
  ('ab89ab85-302b-40f6-92ca-99019ef7b089', 'Consegue que alguém diga a palavra «condomínio».', 10, 1, true),
  ('2376a23c-3aad-4636-88a5-8b05478c4d78', 'Faz com que o grupo inteiro olhe para o céu ao mesmo tempo.', 20, 3, true),
  ('59e4369b-f1c3-4ca7-804f-4f41301baeea', 'Consegue que alguém te empreste os óculos de sol.', 10, 1, true),
  ('4fa6405b-e707-4b0e-ab91-847dd740c0ff', 'Faz um brinde com uma palavra inventada sem ninguém reparar.', 15, 2, true),
  ('56b7f516-cd10-4404-b570-36f6006eb3bc', 'Convence duas pessoas de que já conheceste um jogador famoso.', 15, 2, true),
  ('2f99941d-2e21-4959-bafb-c9e9a3ea0972', 'Fala durante 5 minutos só em inglês até alguém te mandar parar.', 15, 2, true),
  ('d9fff58d-84fb-47cc-abcf-5eada359354e', 'Consegue que alguém diga uma frase inteira em alemão (vale pedir ajuda à Maike).', 15, 2, true),
  ('8d3ebb7f-4ac7-4b0f-959c-7d82fd93b0d4', 'Consegue que alguém proponha um mergulho na piscina.', 10, 1, true),
  ('d602792d-c37f-4658-a50f-6ddd7565ceb3', 'Mete uma pedra no bolso de alguém sem que dê conta.', 20, 3, true),
  ('7fad106e-4fd5-49c2-9628-7e7087a0fabc', 'Consegue que três pessoas te chamem por uma alcunha nova.', 20, 3, true),
  ('f3fdc00c-0445-416c-9bf3-73b9ce814ce9', 'Faz com que alguém te conte um segredo de infância.', 15, 2, true),
  ('267f0c9b-e92e-44fa-8a13-0dea2698bcfe', 'Consegue que alguém te peça desculpa por uma coisa que não fez.', 20, 3, true),
  ('ab878981-9c24-4554-8e62-02e6ea9b4a20', 'Troca o lugar de três coisas na cozinha sem quem está a cozinhar dar por isso.', 20, 3, true),
  ('4223d9b5-20f5-47fb-9df8-9b12c67e9589', 'Consegue que alguém diga «isso é o que tu pensas».', 15, 2, true),
  ('39577686-dcad-4f2a-a98e-4922f792fbf6', 'Consegue que alguém te vá buscar uma bebida ao frigorífico duas vezes.', 15, 2, true),
  ('136e34d7-f511-4662-83cd-ce6d9d906a26', 'Elogia o mesmo detalhe da roupa de três pessoas diferentes.', 10, 1, true),
  ('0886ab63-cc2b-4601-a827-3eca9583bcf3', 'Consegue que alguém te explique as regras de um jogo que tu próprio inventaste.', 20, 3, true),
  ('286d9244-480c-4b6b-a519-85089d9c7f2f', 'Faz com que duas pessoas discutam qual é o melhor caminho para a cascata.', 20, 3, true),
  ('a69f3fb3-b8bb-48e8-8e30-b82c7c4b8c5a', 'Consegue que alguém adivinhe em que ano aconteceu um evento histórico que inventaste.', 15, 2, true),
  ('9f1b2489-0586-49a1-ac90-3cf089c0b5f9', 'Mete a frase «como dizia o meu avô» em duas conversas.', 10, 1, true),
  ('c474125f-1cc1-4b99-ae44-17907c9d5825', 'Consegue que alguém cante uma música dos anos 2000.', 10, 1, true),
  ('c7eb86f8-8b88-46ee-bf67-734c243d064b', 'Convence alguém de que a água do Gerês tem propriedades mágicas.', 10, 1, true);

insert into prompts (text) values
  ('Qual é a coisa mais parva que já fizeste por dinheiro?'),
  ('Qual dos presentes seria o primeiro a ser preso, e porquê?'),
  ('Qual foi o momento mais vergonhoso da história das nossas férias?'),
  ('Se o Falcão despachasse finalmente uma tarefa, qual devia ser?'),
  ('O que é que a Camila, a Olívia e o Manel vão descobrir de embaraçoso sobre os pais quando forem grandes?'),
  ('Qual é o prato que o Gil e o Cristian nunca deviam discutir à frente da Maria?'),
  ('Que negócio é que este grupo devia montar junto — e que ia falir em seis meses?'),
  ('Qual é o segredo mais mal guardado deste grupo?'),
  ('O que é que o José fazia no dia em que a Condie fosse vendida por milhões?'),
  ('Qual vai ser a próxima frase feita deste grupo?'),
  ('Qual dos presentes sobreviveria menos tempo num apocalipse, e porquê?'),
  ('O que é que a Cruz ainda se lembra que todos os outros já esqueceram?');

insert into game_state (id, current_day, camera_player_id, draw_reveal) values
  (1, 1, '4115d653-3446-449e-a71a-9c152bd25ade', 0);

-- 3 missões secretas por jogador, dia 1
insert into assignments (player_id, mission_id, day, status) values
  ('d88bad53-898c-4f07-a732-63548f209789', 'e3cd599c-1b78-4f14-9453-7f3331ffe9f6', 1, 'ativa'),
  ('d88bad53-898c-4f07-a732-63548f209789', 'ab878981-9c24-4554-8e62-02e6ea9b4a20', 1, 'ativa'),
  ('d88bad53-898c-4f07-a732-63548f209789', '7fad106e-4fd5-49c2-9628-7e7087a0fabc', 1, 'ativa'),
  ('be79dea3-70b2-4418-b77d-1e60f1514160', '8d3ebb7f-4ac7-4b0f-959c-7d82fd93b0d4', 1, 'ativa'),
  ('be79dea3-70b2-4418-b77d-1e60f1514160', 'f8b226ee-95e9-4124-b088-456fe87d2e65', 1, 'ativa'),
  ('be79dea3-70b2-4418-b77d-1e60f1514160', '9f1b2489-0586-49a1-ac90-3cf089c0b5f9', 1, 'ativa'),
  ('18f74891-189d-4fc8-9851-c3b923b3fcd5', 'c7eb86f8-8b88-46ee-bf67-734c243d064b', 1, 'ativa'),
  ('18f74891-189d-4fc8-9851-c3b923b3fcd5', '59e4369b-f1c3-4ca7-804f-4f41301baeea', 1, 'ativa'),
  ('18f74891-189d-4fc8-9851-c3b923b3fcd5', '4223d9b5-20f5-47fb-9df8-9b12c67e9589', 1, 'ativa'),
  ('88145f95-c015-4afa-84f2-ad2f4f365501', 'ab89ab85-302b-40f6-92ca-99019ef7b089', 1, 'ativa'),
  ('88145f95-c015-4afa-84f2-ad2f4f365501', 'd9fff58d-84fb-47cc-abcf-5eada359354e', 1, 'ativa'),
  ('88145f95-c015-4afa-84f2-ad2f4f365501', 'b676d731-8efc-40b7-8f76-3f0385a6d7a6', 1, 'ativa'),
  ('28e19b8a-4972-4dbc-be74-2f5e8d09a06a', 'dd9f5eb6-9f90-4c45-80ff-c478655d943a', 1, 'ativa'),
  ('28e19b8a-4972-4dbc-be74-2f5e8d09a06a', 'fb6760b4-8e96-4f69-9974-5717c09813fe', 1, 'ativa'),
  ('28e19b8a-4972-4dbc-be74-2f5e8d09a06a', '1d35bae1-dd55-4edd-9ae4-1a1114028685', 1, 'ativa'),
  ('75fd3271-9e65-49c5-8183-5dfed661075c', '136e34d7-f511-4662-83cd-ce6d9d906a26', 1, 'ativa'),
  ('75fd3271-9e65-49c5-8183-5dfed661075c', 'd602792d-c37f-4658-a50f-6ddd7565ceb3', 1, 'ativa'),
  ('75fd3271-9e65-49c5-8183-5dfed661075c', '7ea9d155-c030-4a95-8226-23705991fafc', 1, 'ativa'),
  ('f9afead4-47af-4156-adaa-aa5f4743faa1', '0934f2eb-8df6-4a2d-95a3-b2930ba512d9', 1, 'ativa'),
  ('f9afead4-47af-4156-adaa-aa5f4743faa1', '39577686-dcad-4f2a-a98e-4922f792fbf6', 1, 'ativa'),
  ('f9afead4-47af-4156-adaa-aa5f4743faa1', 'cf40e3f3-07ae-4c1d-ad05-c405e19c4376', 1, 'ativa'),
  ('f5cdda6a-bb53-462e-8c07-a8d210397774', '2376a23c-3aad-4636-88a5-8b05478c4d78', 1, 'ativa'),
  ('f5cdda6a-bb53-462e-8c07-a8d210397774', '2b17a004-19d5-4c83-be0a-3a79b7875966', 1, 'ativa'),
  ('f5cdda6a-bb53-462e-8c07-a8d210397774', '4fa6405b-e707-4b0e-ab91-847dd740c0ff', 1, 'ativa'),
  ('eff6439f-94ca-4d59-83dc-5669f19ffbbb', '267f0c9b-e92e-44fa-8a13-0dea2698bcfe', 1, 'ativa'),
  ('eff6439f-94ca-4d59-83dc-5669f19ffbbb', '5802f537-5bde-46df-ac44-32b29f285ee0', 1, 'ativa'),
  ('eff6439f-94ca-4d59-83dc-5669f19ffbbb', 'f3fdc00c-0445-416c-9bf3-73b9ce814ce9', 1, 'ativa'),
  ('4115d653-3446-449e-a71a-9c152bd25ade', '56b7f516-cd10-4404-b570-36f6006eb3bc', 1, 'ativa'),
  ('4115d653-3446-449e-a71a-9c152bd25ade', '1eb888ee-5b41-40f9-bba1-262789765f96', 1, 'ativa'),
  ('4115d653-3446-449e-a71a-9c152bd25ade', '91d1d365-a20b-4331-b999-ddbb20cd2a76', 1, 'ativa');
