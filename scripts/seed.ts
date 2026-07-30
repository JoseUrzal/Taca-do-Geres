/**
 * Seed da Taça do Gerês.
 * Corre com: npx tsx scripts/seed.ts
 * Lê .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 *
 * APAGA todos os dados e volta a semear:
 *  - 2 equipas, 10 jogadores
 *  - missões de content/missoes.json
 *  - perguntas de content/prompts.json
 *  - game_state (dia 1, câmara do dia aleatória)
 *  - 3 missões atribuídas a cada jogador para o dia 1
 *
 * Substitui os JSON em content/ à vontade — o script não depende do conteúdo.
 * TODO: os nomes dos jogadores/equipas estão hardcoded abaixo — edita antes de correr.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const TEAMS = [
  { name: "Lontras do Rio", colour_hex: "#FF3D7F" },
  { name: "Javalis da Serra", colour_hex: "#3AA76D" },
];

// 10 jogadores, SEM equipa — o sorteio faz-se ao vivo no /admin e revela-se na TV
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function wipe() {
  // ordem inversa das dependências
  for (const table of [
    "guesses", "answers", "score_events", "approvals", "accusations",
    "assignments", "moments", "rounds", "prompts", "missions",
  ]) {
    const { error } = await db.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`wipe ${table}: ${error.message}`);
  }
  await db.from("game_state").delete().eq("id", 1);
  await db.from("players").delete().not("id", "is", null);
  await db.from("teams").delete().not("id", "is", null);
}

async function main() {
  console.log("A limpar tabelas…");
  await wipe();

  console.log("Equipas + jogadores…");
  const { data: teams, error: te } = await db.from("teams").insert(TEAMS).select();
  if (te || !teams) throw new Error(te?.message);

  const playerRows = PLAYERS.map((p) => ({ ...p, team_id: null }));
  const { data: players, error: pe } = await db.from("players").insert(playerRows).select();
  if (pe || !players) throw new Error(pe?.message);

  console.log("Missões…");
  const missoes = JSON.parse(readFileSync("content/missoes.json", "utf8"));
  const { data: missions, error: me } = await db.from("missions").insert(missoes).select();
  if (me || !missions) throw new Error(me?.message);

  console.log("Perguntas…");
  const prompts = JSON.parse(readFileSync("content/prompts.json", "utf8")) as string[];
  const { error: pre } = await db.from("prompts").insert(prompts.map((text) => ({ text })));
  if (pre) throw new Error(pre.message);

  console.log("Estado do jogo…");
  const camera = players[Math.floor(Math.random() * players.length)];
  const { error: ge } = await db.from("game_state").insert({
    id: 1, current_day: 1, camera_player_id: camera.id, draw_reveal: 0,
  });
  if (ge) throw new Error(ge.message);

  console.log("A dar 3 missões a cada jogador (dia 1)…");
  const deck = shuffle(missions);
  const deals: { player_id: string; mission_id: string; day: number }[] = [];
  let i = 0;
  for (const p of players) {
    for (let k = 0; k < 3; k++) {
      const m = deck[i++];
      if (!m) throw new Error("Não há missões suficientes (precisas de ≥ 30).");
      deals.push({ player_id: p.id, mission_id: m.id, day: 1 });
    }
  }
  const { error: de } = await db.from("assignments").insert(deals);
  if (de) throw new Error(de.message);

  console.log(`Feito. Câmara do dia: ${camera.name}. Bom fim de semana. 🏆`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
