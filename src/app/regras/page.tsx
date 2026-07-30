"use client";

import Shell from "@/components/Shell";

// Regras no telemóvel — a versão de bolso da cerimónia de abertura.
export default function RegrasPage() {
  return (
    <Shell title="Regras">
      <div className="space-y-4">
        <Regra emoji="🏆" titulo="A Taça">
          Tudo dá pontos: missões, acusações, palpites e jogos físicos. Há um
          campeão individual e uma equipa vencedora, decididos domingo à noite.
          O marcador vive em <b>Taça</b> e na TV.
        </Regra>

        <Regra emoji="🕵️" titulo="Missões Secretas">
          Tens <b>3 missões secretas por dia</b> (estão na tua Casa). O catálogo
          completo é público em <b>Missões</b> — toda a gente sabe o que anda em
          jogo, ninguém sabe quem tem o quê. Cumpre a missão sem que ninguém
          perceba que era uma missão.
        </Regra>

        <Regra emoji="⚖️" titulo="Reclamar & Tribunal">
          Cumpriste? Toca em <b>Reclamar</b>. O teu caso vai para o Tribunal,
          onde os outros votam: <b>2 ✅ confirmam</b> e recebes os pontos;{" "}
          <b>2 ❌ chumbam</b> e a missão arde sem pontos. Não podes votar no teu
          próprio caso.
        </Regra>

        <Regra emoji="🎯" titulo="Acusações">
          Achas que alguém anda a tentar uma missão? Em <b>Acusar</b>, escolhe a
          pessoa e a missão do catálogo. Certo: <b>+15</b> e a missão dessa
          pessoa arde. Errado: <b>−5</b>. Só tens <b>2 por dia</b> — gasta-as
          com cabeça.
        </Regra>

        <Regra emoji="🎤" titulo="Quem Disse Isto?">
          Quando houver ronda (aparece «Ao vivo» no topo), responde à pergunta
          no telemóvel. Depois as respostas aparecem anónimas na TV e cada um
          adivinha quem escreveu o quê: <b>+5</b> por acerto, <b>+3</b> para ti
          por cada pessoa que enganares.
        </Regra>

        <Regra emoji="🏊" titulo="Jogos físicos">
          Saltos, Mölkky, olimpíadas, prova cega… cada evento tem pódio de{" "}
          <b>10/6/3</b> pontos, registado na hora.
        </Regra>

        <Regra emoji="🎥" titulo="Câmara do dia & Momentos">
          Todos os dias há um responsável por filmar — está na tua Casa e na TV.
          E quando acontecer algo digno de memória, qualquer um toca em{" "}
          <b>Guardar momento</b>: é o guião do vídeo de domingo.
        </Regra>

        <p className="rounded-lg border border-rosa/40 bg-pinhal p-4 text-center text-sm text-cal-fraca">
          Dúvidas? Grita pelo José. Decisões do Tribunal são soberanas.
        </p>
      </div>
    </Shell>
  );
}

function Regra({
  emoji,
  titulo,
  children,
}: {
  emoji: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg bg-pinhal p-4">
      <h2 className="display text-lg font-bold">
        {emoji} {titulo}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-cal/90">{children}</p>
    </section>
  );
}
