"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Cerimónia de abertura — slideshow para a TV, ~10 min com o anfitrião a
// apresentar. Clique/toque ou setas do teclado para avançar. Termina a
// apontar para o sorteio das equipas.

type Slide = {
  kicker?: string;
  title: string;
  lines?: string[];
  big?: string;
  gold?: boolean;
};

const SLIDES: Slide[] = [
  {
    kicker: "GERÊS · 31 JUL — 2 AGO",
    title: "Taça do Gerês",
    lines: ["Este fim de semana não é um fim de semana.", "É um campeonato."],
    big: "🏆",
    gold: true,
  },
  {
    kicker: "O ESSENCIAL",
    title: "O telemóvel é o comando",
    lines: [
      "Cada um abre o link e escolhe o seu nome — uma vez.",
      "Tudo o que acontece dá pontos: jogos, missões, palpites.",
      "Vencedor individual e equipa campeã. As crianças dormem; os adultos competem.",
    ],
  },
  {
    kicker: "JOGO 1",
    title: "Missões Secretas",
    lines: [
      "Cada um recebe 3 missões secretas por dia.",
      "O catálogo de missões é público — sabem o que anda em jogo…",
      "…mas não sabem quem tem o quê. Desconfiem de tudo.",
    ],
    big: "🕵️",
  },
  {
    kicker: "MISSÕES SECRETAS",
    title: "Cumpriste? Reclama.",
    lines: [
      "Cumpres a missão à frente de todos sem ninguém topar → «Reclamar».",
      "Vai a Tribunal: 2 ✅ de outros jogadores confirmam e dão os pontos.",
      "2 ❌ chumbam — sem pontos e a missão arde.",
    ],
    big: "⚖️",
  },
  {
    kicker: "MISSÕES SECRETAS",
    title: "Apanha os outros",
    lines: [
      "Achas que alguém anda a tentar uma missão? Acusa: pessoa + missão.",
      "Acertaste → +15 pontos e a missão dessa pessoa arde.",
      "Falhaste → −5. E só tens 2 acusações por dia. Usa-as bem.",
    ],
    big: "🎯",
  },
  {
    kicker: "JOGO 2",
    title: "Quem Disse Isto?",
    lines: [
      "Uma pergunta aparece nesta TV e nos telemóveis.",
      "Todos respondem em segredo. As respostas aparecem aqui, anónimas.",
      "Depois: quem escreveu o quê? +5 por acerto, +3 por cada enganado.",
    ],
    big: "🎤",
  },
  {
    kicker: "JOGOS FÍSICOS",
    title: "Tudo conta para a Taça",
    lines: [
      "Saltos para a piscina, Mölkky, olimpíadas parvas, prova cega…",
      "Cada evento tem pódio: 10 / 6 / 3 pontos.",
      "Fica tudo registado no marcador — sem discussões. (Quase.)",
    ],
    big: "🏊",
  },
  {
    kicker: "REGRA SAGRADA",
    title: "Câmara do dia",
    lines: [
      "Todos os dias sai em sorteio um responsável pela câmara.",
      "Se está a acontecer, tem de ficar filmado.",
      "E qualquer um pode «Guardar momento» na app — é o guião do vídeo final.",
    ],
    big: "🎥",
  },
  {
    kicker: "DOMINGO",
    title: "Como se ganha",
    lines: [
      "O marcador está sempre nesta TV e no /taca de cada um.",
      "Domingo à noite: campeão individual e equipa vencedora.",
      "O ouro não se pede. Conquista-se.",
    ],
    big: "🥇",
    gold: true,
  },
  {
    kicker: "AGORA",
    title: "O sorteio",
    lines: [
      "Telemóveis na mão. Nome escolhido. Já ninguém confia em ninguém.",
      "Falta uma coisa: as equipas.",
      "Sorteadas ao calhas, aqui, agora — um a um.",
    ],
    big: "🎲",
  },
];

export default function AberturaPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const last = i === SLIDES.length - 1;

  const next = useCallback(() => {
    setI((v) => Math.min(v + 1, SLIDES.length - 1));
  }, []);
  const prev = useCallback(() => setI((v) => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div
      className="flex min-h-dvh cursor-pointer flex-col bg-granito p-5 md:p-12 text-cal"
      onClick={() => !last && next()}
    >
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        {slide.big && <p className="text-5xl md:text-9xl">{slide.big}</p>}
        {slide.kicker && (
          <p className="display mt-8 text-xl md:text-3xl font-bold tracking-widest text-rosa">
            {slide.kicker}
          </p>
        )}
        <h1
          className={`display mt-3 text-4xl md:text-8xl font-bold leading-none ${
            slide.gold ? "text-ouro" : ""
          }`}
        >
          {slide.title}
        </h1>
        {slide.lines && (
          <div className="mt-10 space-y-4">
            {slide.lines.map((l, k) => (
              <p key={k} className="text-2xl md:text-4xl leading-snug text-cal">
                {l}
              </p>
            ))}
          </div>
        )}

        {last && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/tv");
            }}
            className="display mt-14 min-h-14 md:min-h-20 rounded-xl bg-rosa px-8 md:px-16 text-2xl md:text-4xl font-bold text-granito"
          >
            Para o sorteio →
          </button>
        )}
      </main>

      <footer className="flex items-center justify-between">
        <p className="num text-lg md:text-2xl text-cal-fraca">
          {i + 1}/{SLIDES.length}
        </p>
        <p className="display text-lg md:text-2xl text-cal-fraca">
          {last ? "" : "toca no ecrã ou → para avançar"}
        </p>
      </footer>
    </div>
  );
}
