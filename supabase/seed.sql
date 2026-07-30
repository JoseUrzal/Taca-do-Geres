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
  ('0cd27822-bf05-43aa-8269-6b3f867c9c07', 'Um Gajo FC', '#FF3D7F'),
  ('237abb5f-a494-4456-84a4-279bcbcc30ba', 'Que Inferno SC', '#3AA76D');

-- team_id fica NULL: o sorteio das equipas é feito ao vivo (/admin → TV)
insert into players (id, name, short_name, emoji, team_id) values
  ('e769b1c5-c19b-4de9-8818-7f90b9ac6ccb', 'José', 'José', '🦦', null),
  ('368919c3-f0d0-4610-b310-b90d29535be6', 'Joana M.', 'Joana M', '🌻', null),
  ('61e62cac-332f-4c66-9fe0-f1e7d171d5b7', 'Maria', 'Maria', '🦋', null),
  ('a5d867e2-ff34-464a-a9b2-dc2791a1ea53', 'Cristian', 'Cristian', '🌶️', null),
  ('b7aa3310-8351-4183-b1a0-c16cea13a864', 'Gil', 'Gil', '🍺', null),
  ('3998b39c-12fb-4170-a3fc-4f3dd6b4adfa', 'Maike', 'Maike', '🎸', null),
  ('6fae1d42-b806-4d9e-9786-73e64ebca119', 'Falcão', 'Falcão', '🦅', null),
  ('c8dabcbe-7433-4b2d-8b66-c3f7a62dea02', 'Ana', 'Ana', '🌊', null),
  ('a4a52dd4-b035-40b4-8559-bb8421cb3feb', 'Joana C.', 'Joana C', '🍀', null),
  ('54fbf28d-c4c8-43d4-be4e-db51f5d69dd0', 'João D.', 'João D', '🎣', null);

insert into missions (id, text, points, difficulty, active) values
  ('98ff5d54-02fd-48b4-8911-81334e608c54', 'Faz com que alguém diga «Que inferno!» sem seres tu a dizê-lo primeiro.', 15, 2, true),
  ('c8e3cf69-2527-4697-9e62-f252dc627561', 'Faz com que alguém diga «um gajo…» numa frase.', 10, 1, true),
  ('42f10b3b-34d5-4fe5-a8e9-8044a143841f', 'Bebe um copo inteiro com o dedo indicador dentro do copo, à Melo, sem ninguém comentar.', 15, 2, true),
  ('35834a00-d320-421e-9b39-a9f0fa0c2152', 'Roça o dedo no tecido da roupa de três pessoas diferentes, à José.', 15, 2, true),
  ('2e8cb59d-88fb-4dd6-ae06-4b394a672b8c', 'Consegue que alguém te explique como se ganha o Masterchef.', 10, 1, true),
  ('9064b6a3-bd95-436e-ba5a-5385bf1cc367', 'Convence alguém de que o Real Madrid está de olho num jogador que acabaste de inventar.', 15, 2, true),
  ('6d1ec6a2-8d92-4b74-91cf-981df3284cb9', 'Faz com que alguém diga «palhaços aqui a bater».', 15, 2, true),
  ('700b9df2-96f5-4d70-9190-d577809d0ba2', 'Mete a palavra «sustentabilidade» em três conversas diferentes.', 15, 2, true),
  ('a455d694-49fc-48cc-8e89-a1bcc4c9d884', 'Consegue que alguém te recomende uma compra na Zara.', 10, 1, true),
  ('83125407-35d6-4b80-8373-9d2ff908d2da', 'Faz com que alguém conte uma história das férias de La Manga.', 10, 1, true),
  ('1908be3f-865c-44a8-9f9f-9810ab60d8a6', 'Convence alguém de que a Liga vai aprovar uma regra nova absurda no futebol.', 15, 2, true),
  ('3a24fc2b-13a6-4b5f-9b7c-b6326ce93eac', 'Consegue que alguém corrija a maneira como puseste a louça na máquina.', 15, 2, true),
  ('3a587f31-7293-4fcf-8b25-25956b0b6011', 'Consegue que alguém te desenhe a planta de uma divisão da casa.', 15, 2, true),
  ('93318e5e-0b12-4732-a9cc-62c691c9c21f', 'Faz com que alguém diga os nomes dos três bebés do grupo de seguida.', 10, 1, true),
  ('74777f53-92fa-4e75-9b2f-0e048a486346', 'Convence alguém de que em criança ganhaste um concurso de karaoke.', 15, 2, true),
  ('811632df-adef-4a94-81d6-b31b06671a96', 'Corrige a geografia de alguém com confiança total, mesmo sem teres a certeza.', 10, 1, true),
  ('f62eb2f3-47b9-4b87-b809-454c19d0eea8', 'Consegue que alguém avalie o teu empratamento como um jurado do Masterchef.', 15, 2, true),
  ('6800d8c9-3997-44ba-a2bc-59667868bcb2', 'Faz com que outra pessoa te encha o copo sem tu pedires.', 10, 1, true),
  ('6c5e9e37-cf5d-483c-ae09-a861688e2909', 'Consegue que alguém diga a palavra «condomínio».', 10, 1, true),
  ('483f4c26-005c-459f-ba1b-64f9550f8960', 'Faz com que o grupo inteiro olhe para o céu ao mesmo tempo.', 20, 3, true),
  ('d5f8483d-e8e5-4b76-8667-f10166361b27', 'Consegue que alguém te empreste os óculos de sol.', 10, 1, true),
  ('e1e6f61b-9cff-4bcc-b4f7-57e4cbba4629', 'Faz um brinde com uma palavra inventada sem ninguém reparar.', 15, 2, true),
  ('83495ee1-70f8-4a50-b2f7-1c3c2fc87888', 'Convence duas pessoas de que já conheceste um jogador famoso.', 15, 2, true),
  ('dce41d08-6161-48df-b166-5cadf0c06f64', 'Fala durante 5 minutos só em inglês até alguém te mandar parar.', 15, 2, true),
  ('a43ade78-a66c-440c-9c10-1f65a34403f0', 'Consegue que alguém diga uma frase inteira em alemão (vale pedir ajuda à Maike).', 15, 2, true),
  ('42061371-c37f-4d71-bff9-01de74b9d1be', 'Consegue que alguém proponha um mergulho na piscina.', 10, 1, true),
  ('7457bc1f-27b0-431e-b175-6ce2ad67fe1b', 'Mete uma pedra no bolso de alguém sem que dê conta.', 20, 3, true),
  ('61b60409-5a78-4701-b011-4ffaf944bb7f', 'Consegue que três pessoas te chamem por uma alcunha nova.', 20, 3, true),
  ('298b267c-c533-460b-bbe3-924f67a0fd3e', 'Faz com que alguém te conte um segredo de infância.', 15, 2, true),
  ('757a4958-b71d-4723-867e-a82420cb372f', 'Consegue que alguém te peça desculpa por uma coisa que não fez.', 20, 3, true),
  ('c7d30f1a-2543-41fa-a5f6-845daf20fb24', 'Troca o lugar de três coisas na cozinha sem quem está a cozinhar dar por isso.', 20, 3, true),
  ('de87b7df-cacf-468c-a612-49e8ae5f319b', 'Consegue que alguém diga «isso é o que tu pensas».', 15, 2, true),
  ('d18adf50-fe20-47c4-801a-e374ed16b4a9', 'Consegue que alguém te vá buscar uma bebida ao frigorífico duas vezes.', 15, 2, true),
  ('af248481-a853-49ef-9f6a-03cdaf3f30be', 'Elogia o mesmo detalhe da roupa de três pessoas diferentes.', 10, 1, true),
  ('ecc66797-ff90-41e5-82e4-eb0482c68400', 'Consegue que alguém te explique as regras de um jogo que tu próprio inventaste.', 20, 3, true),
  ('9ce8b8b0-4142-484c-b68a-95953022f219', 'Faz com que duas pessoas discutam qual é o melhor caminho para a cascata.', 20, 3, true),
  ('7720a9b4-e3a8-4ce5-b76b-f278cdb5bce3', 'Consegue que alguém adivinhe em que ano aconteceu um evento histórico que inventaste.', 15, 2, true),
  ('872a7e1f-e7e4-499d-ae08-fffd74befbb6', 'Mete a frase «como dizia o meu avô» em duas conversas.', 10, 1, true),
  ('a04c1adc-3782-4c41-a2bd-c6c4fe92bf25', 'Consegue que alguém cante uma música dos anos 2000.', 10, 1, true),
  ('93761136-7c3f-4d76-aa0d-6fb3a975b0e5', 'Convence alguém de que a água do Gerês tem propriedades mágicas.', 10, 1, true);

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
  (1, 1, '3998b39c-12fb-4170-a3fc-4f3dd6b4adfa', 0);

-- 3 missões secretas por jogador, dia 1
insert into assignments (player_id, mission_id, day, status) values
  ('e769b1c5-c19b-4de9-8818-7f90b9ac6ccb', '298b267c-c533-460b-bbe3-924f67a0fd3e', 1, 'ativa'),
  ('e769b1c5-c19b-4de9-8818-7f90b9ac6ccb', 'e1e6f61b-9cff-4bcc-b4f7-57e4cbba4629', 1, 'ativa'),
  ('e769b1c5-c19b-4de9-8818-7f90b9ac6ccb', 'c7d30f1a-2543-41fa-a5f6-845daf20fb24', 1, 'ativa'),
  ('368919c3-f0d0-4610-b310-b90d29535be6', '7720a9b4-e3a8-4ce5-b76b-f278cdb5bce3', 1, 'ativa'),
  ('368919c3-f0d0-4610-b310-b90d29535be6', 'de87b7df-cacf-468c-a612-49e8ae5f319b', 1, 'ativa'),
  ('368919c3-f0d0-4610-b310-b90d29535be6', '83125407-35d6-4b80-8373-9d2ff908d2da', 1, 'ativa'),
  ('61e62cac-332f-4c66-9fe0-f1e7d171d5b7', 'af248481-a853-49ef-9f6a-03cdaf3f30be', 1, 'ativa'),
  ('61e62cac-332f-4c66-9fe0-f1e7d171d5b7', '35834a00-d320-421e-9b39-a9f0fa0c2152', 1, 'ativa'),
  ('61e62cac-332f-4c66-9fe0-f1e7d171d5b7', '6800d8c9-3997-44ba-a2bc-59667868bcb2', 1, 'ativa'),
  ('a5d867e2-ff34-464a-a9b2-dc2791a1ea53', '7457bc1f-27b0-431e-b175-6ce2ad67fe1b', 1, 'ativa'),
  ('a5d867e2-ff34-464a-a9b2-dc2791a1ea53', '9064b6a3-bd95-436e-ba5a-5385bf1cc367', 1, 'ativa'),
  ('a5d867e2-ff34-464a-a9b2-dc2791a1ea53', '3a587f31-7293-4fcf-8b25-25956b0b6011', 1, 'ativa'),
  ('b7aa3310-8351-4183-b1a0-c16cea13a864', '42061371-c37f-4d71-bff9-01de74b9d1be', 1, 'ativa'),
  ('b7aa3310-8351-4183-b1a0-c16cea13a864', '42f10b3b-34d5-4fe5-a8e9-8044a143841f', 1, 'ativa'),
  ('b7aa3310-8351-4183-b1a0-c16cea13a864', '483f4c26-005c-459f-ba1b-64f9550f8960', 1, 'ativa'),
  ('3998b39c-12fb-4170-a3fc-4f3dd6b4adfa', 'a04c1adc-3782-4c41-a2bd-c6c4fe92bf25', 1, 'ativa'),
  ('3998b39c-12fb-4170-a3fc-4f3dd6b4adfa', 'a455d694-49fc-48cc-8e89-a1bcc4c9d884', 1, 'ativa'),
  ('3998b39c-12fb-4170-a3fc-4f3dd6b4adfa', 'dce41d08-6161-48df-b166-5cadf0c06f64', 1, 'ativa'),
  ('6fae1d42-b806-4d9e-9786-73e64ebca119', 'c8e3cf69-2527-4697-9e62-f252dc627561', 1, 'ativa'),
  ('6fae1d42-b806-4d9e-9786-73e64ebca119', '74777f53-92fa-4e75-9b2f-0e048a486346', 1, 'ativa'),
  ('6fae1d42-b806-4d9e-9786-73e64ebca119', '6d1ec6a2-8d92-4b74-91cf-981df3284cb9', 1, 'ativa'),
  ('c8dabcbe-7433-4b2d-8b66-c3f7a62dea02', 'd18adf50-fe20-47c4-801a-e374ed16b4a9', 1, 'ativa'),
  ('c8dabcbe-7433-4b2d-8b66-c3f7a62dea02', '9ce8b8b0-4142-484c-b68a-95953022f219', 1, 'ativa'),
  ('c8dabcbe-7433-4b2d-8b66-c3f7a62dea02', '83495ee1-70f8-4a50-b2f7-1c3c2fc87888', 1, 'ativa'),
  ('a4a52dd4-b035-40b4-8559-bb8421cb3feb', '872a7e1f-e7e4-499d-ae08-fffd74befbb6', 1, 'ativa'),
  ('a4a52dd4-b035-40b4-8559-bb8421cb3feb', '93318e5e-0b12-4732-a9cc-62c691c9c21f', 1, 'ativa'),
  ('a4a52dd4-b035-40b4-8559-bb8421cb3feb', 'd5f8483d-e8e5-4b76-8667-f10166361b27', 1, 'ativa'),
  ('54fbf28d-c4c8-43d4-be4e-db51f5d69dd0', '61b60409-5a78-4701-b011-4ffaf944bb7f', 1, 'ativa'),
  ('54fbf28d-c4c8-43d4-be4e-db51f5d69dd0', '811632df-adef-4a94-81d6-b31b06671a96', 1, 'ativa'),
  ('54fbf28d-c4c8-43d4-be4e-db51f5d69dd0', '98ff5d54-02fd-48b4-8911-81334e608c54', 1, 'ativa');
