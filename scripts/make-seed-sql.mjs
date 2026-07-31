// Gera supabase/seed.sql para colar no SQL Editor do Supabase.
// Corre com: node scripts/make-seed-sql.mjs
// Alternativa ao scripts/seed.ts para quando não há acesso de rede à BD.
// APAGA todos os dados e semeia: equipas, jogadores (SEM equipa — o sorteio
// é feito ao vivo no /admin e revelado na TV), missões, perguntas,
// game_state e as 3 missões de cada jogador para o dia 1.
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const TEAMS = [
  { name: "Um Gajo FC", colour_hex: "#4F46E5" },
  { name: "Que Inferno SC", colour_hex: "#FF6B57" },
];

const PLAYERS = [
  { name: "José", short_name: "José", emoji: "🦦" },
  { name: "Joana M.", short_name: "Joana M", emoji: "🌻" },
  { name: "Maria", short_name: "Maria", emoji: "🦋" },
  { name: "Cristian", short_name: "Cristian", emoji: "🌶️" },
  { name: "Gil", short_name: "Gil", emoji: "🍺" },
  { name: "Maike", short_name: "Maike", emoji: "🎸" },
  { name: "Falcão", short_name: "Falcão", emoji: "🦅" },
  { name: "Ana", short_name: "Ana", emoji: "🌊" },
  { name: "Joana C.", short_name: "Joana C", emoji: "🍀" },
  { name: "João D.", short_name: "João D", emoji: "🎣" },
];

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const missoes = JSON.parse(readFileSync("content/missoes.json", "utf8"));
const prompts = JSON.parse(readFileSync("content/prompts.json", "utf8"));

const teams = TEAMS.map((t) => ({ ...t, id: randomUUID() }));
const players = PLAYERS.map((p) => ({ ...p, id: randomUUID() }));
const missions = missoes.map((m) => ({ ...m, id: randomUUID() }));

if (missions.length < players.length * 3) {
  console.error(`Só ${missions.length} missões para ${players.length} jogadores — precisas de ≥ ${players.length * 3}.`);
  process.exit(1);
}

const camera = players[Math.floor(Math.random() * players.length)];
const deck = shuffle(missions);
let d = 0;
const assignments = players.flatMap((p) =>
  [0, 1, 2].map(() => ({ player_id: p.id, mission_id: deck[d++].id }))
);

const sql = `-- Taça do Gerês — seed. Cola tudo no SQL Editor do Supabase e corre.
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
${teams.map((t) => `  (${q(t.id)}, ${q(t.name)}, ${q(t.colour_hex)})`).join(",\n")};

-- team_id fica NULL: o sorteio das equipas é feito ao vivo (/admin → TV)
insert into players (id, name, short_name, emoji, team_id) values
${players.map((p) => `  (${q(p.id)}, ${q(p.name)}, ${q(p.short_name)}, ${q(p.emoji)}, null)`).join(",\n")};

insert into missions (id, text, points, difficulty, active) values
${missions.map((m) => `  (${q(m.id)}, ${q(m.text)}, ${m.points}, ${m.difficulty}, true)`).join(",\n")};

insert into prompts (text) values
${prompts.map((t) => `  (${q(t)})`).join(",\n")};

insert into game_state (id, current_day, camera_player_id, draw_reveal) values
  (1, 1, ${q(camera.id)}, 0);

-- 3 missões secretas por jogador, dia 1
insert into assignments (player_id, mission_id, day, status) values
${assignments.map((a) => `  (${q(a.player_id)}, ${q(a.mission_id)}, 1, 'ativa')`).join(",\n")};
`;

writeFileSync("supabase/seed.sql", sql);
console.log(
  `supabase/seed.sql escrito: ${teams.length} equipas, ${players.length} jogadores, ` +
    `${missions.length} missões, ${prompts.length} perguntas, câmara: ${camera.name}.`
);
