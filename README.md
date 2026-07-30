# Taça do Gerês 🏆

App do fim de semana — Gerês, 31 jul a 2 ago 2026. Missões Secretas, Quem
Disse Isto?, leaderboard e modo TV. Next.js 15 + Supabase + Vercel.

## Pôr a funcionar (por esta ordem)

1. **Supabase**: cria um projeto, abre o SQL Editor e cola o conteúdo de
   `supabase/schema.sql`. Corre.
2. **Env**: `cp .env.local.example .env.local` e preenche:
   - `NEXT_PUBLIC_SUPABASE_URL` — Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Settings → API → service_role (⚠️ nunca no cliente)
   - `ADMIN_PIN` — o PIN da página /admin
3. **Conteúdo**: substitui `content/missoes.json` (≥ 30 missões para 10
   jogadores!) e `content/prompts.json` pelo conteúdo real. Edita os nomes dos
   jogadores/equipas no topo de `scripts/seed.ts`.
4. **Seed**: `npm install && npx tsx scripts/seed.ts` — limpa tudo e semeia
   equipas, jogadores, missões, perguntas e as 3 missões de cada um para o dia 1.
5. **Local**: `npm run dev` e abre http://localhost:3000
6. **Deploy**: importa o repo na Vercel, define as 3 variáveis de ambiente,
   deploy. Testa do telemóvel.
7. **TV**: abre `https://<app>.vercel.app/tv` no Chrome e faz cast para a TV.

## Como se joga

- Cada um abre o link, escolhe o nome uma vez (fica em cookie).
- **/casa** — pontos, missões do dia (Reclamar), acusações restantes, momentos.
- **/tribunal** — 2 ✅ confirmam uma missão reclamada; 2 ❌ chumbam-na.
- **/acusar** — 2 acusações/dia: certo +15, errado −5.
- **/admin** (PIN) — novo dia, pontos manuais, eventos com pódio 10/6/3,
  controlo do Quem Disse Isto?, câmara do dia.
- Correções: dar pontos negativos com um motivo — o histórico nunca se apaga.

## Notas técnicas

- Sem auth: identidade = cookie com o id do jogador.
- Polling SWR a cada 2 s; sem websockets.
- Todos os pontos são linhas em `score_events`; o leaderboard é sempre a soma.
- Duplo toque protegido na BD (unique constraints + updates guardados por estado).
