-- RESET TOTAL DOS TESTES — corre isto ANTES do jogo começar a sério.
-- Apaga jogadas, pontos, rondas de quizz e o sorteio de teste.
-- MANTÉM: jogadores, equipas (nomes/cores), catálogo de missões,
-- perguntas do quizz, eventos anunciados e ideias.
-- Cola tudo no SQL Editor do Supabase e corre uma vez.

-- 1) parar qualquer ronda de quizz e voltar ao dia 1, sorteio por fazer
update game_state
   set active_round_id = null,
       current_day     = 1,
       draw_reveal     = 0
 where id = 1;

-- 2) limpar o quizz de teste (as perguntas voltam a ficar disponíveis)
delete from guesses;
delete from answers;
delete from rounds;
update prompts set used = false;

-- 3) limpar votos, acusações, pontos e momentos de teste
delete from approvals;
delete from accusations;
delete from score_events;
delete from moments;

-- 4) missões: o dia 1 volta ao estado inicial (3 ativas por jogador);
--    missões dadas em testes de «novo dia» libertam-se para voltar ao baralho
delete from assignments where day > 1;
update assignments set status = 'ativa' where day = 1;

-- 5) equipas por sortear → a TV fica no ecrã de espera do sorteio
update players set team_id = null;

-- (opcional) descomenta se também quiseres apagar eventos e ideias de teste:
-- delete from events;
-- delete from ideas;
-- delete from help_log;
