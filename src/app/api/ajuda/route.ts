import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { AJUDA_SYSTEM } from "@/lib/ajuda-prompt";

// Chat de ajuda ligado ao Claude. Limites para não haver abusos:
// 10 perguntas/dia por jogador, 150/dia no total, pergunta ≤ 300 caracteres,
// histórico ≤ 6 mensagens. Tudo registado em help_log.
const LIMITE_JOGADOR_DIA = 10;
const LIMITE_GLOBAL_DIA = 150;

export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "sem_chave" }, { status: 503 });
  }

  const { question, history } = (await req.json()) as {
    question: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };
  const q = question?.trim().slice(0, 300);
  if (!q) return NextResponse.json({ error: "vazio" }, { status: 400 });

  // limites diários (dia UTC — chega perfeitamente para isto)
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const [{ count: minhas }, { count: todas }] = await Promise.all([
    db()
      .from("help_log")
      .select("id", { count: "exact", head: true })
      .eq("player_id", playerId)
      .gte("created_at", hoje.toISOString()),
    db()
      .from("help_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hoje.toISOString()),
  ]);
  if ((minhas ?? 0) >= LIMITE_JOGADOR_DIA) {
    return NextResponse.json(
      { answer: "Já gastaste as tuas 10 perguntas de hoje 😅 Amanhã há mais — entretanto, espreita as Regras em Mais." },
      { status: 200 }
    );
  }
  if ((todas ?? 0) >= LIMITE_GLOBAL_DIA) {
    return NextResponse.json(
      { answer: "O grupo esgotou as perguntas de hoje. As Regras (em Mais) respondem a quase tudo!" },
      { status: 200 }
    );
  }

  await db().from("help_log").insert({ player_id: playerId, question: q });

  const client = new Anthropic();
  const past = (history ?? []).slice(-6).map((m) => ({
    role: m.role,
    content: String(m.content).slice(0, 500),
  }));

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 1200, // inclui o thinking; a resposta em si é curta
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        {
          type: "text",
          text: AJUDA_SYSTEM,
          cache_control: { type: "ephemeral" }, // regras estáveis → cache barata
        },
      ],
      messages: [...past, { role: "user" as const, content: q }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({
        answer: "Essa não posso responder 😄 Pergunta-me antes sobre o jogo.",
      });
    }

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();

    return NextResponse.json({
      answer: text || "Fiquei sem palavras — tenta reformular?",
    });
  } catch {
    return NextResponse.json(
      { answer: "O assistente está a dormir a sesta. Tenta outra vez daqui a bocado." },
      { status: 200 }
    );
  }
}
