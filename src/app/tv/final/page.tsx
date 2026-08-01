"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Avatar from "@/components/Avatar";
import { fetcher } from "@/lib/client";

// Cerimónia de encerramento — domingo à tarde, na TV. Clique/toque avança.
// Ordem: intro → medalhas (uma a uma) → 3.º → 2.º → CAMPEÃO → fim.

type Final = {
  podium: { name: string; emoji: string; points: number; rank: number }[];
  medals: { titulo: string; icone: string; nome: string; emoji: string; detalhe: string }[];
};

type Slide =
  | { kind: "intro" }
  | { kind: "medal"; m: Final["medals"][number] }
  | { kind: "podium"; p: Final["podium"][number]; label: string; gold?: boolean }
  | { kind: "fim" };

export default function FinalPage() {
  const router = useRouter();
  const { data } = useSWR<Final>("/api/final", fetcher);
  const [i, setI] = useState(0);

  const slides: Slide[] = [];
  if (data) {
    slides.push({ kind: "intro" });
    for (const m of data.medals) slides.push({ kind: "medal", m });
    const [first, second, third] = data.podium;
    if (third) slides.push({ kind: "podium", p: third, label: "3.º lugar" });
    if (second) slides.push({ kind: "podium", p: second, label: "2.º lugar" });
    if (first) slides.push({ kind: "podium", p: first, label: "CAMPEÃO DA TAÇA DO GERÊS", gold: true });
    slides.push({ kind: "fim" });
  }
  const slide = slides[Math.min(i, slides.length - 1)];
  const last = i >= slides.length - 1;

  const next = () => setI((v) => Math.min(v + 1, slides.length - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") next();
      if (e.key === "ArrowLeft") setI((v) => Math.max(v - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="dark flex min-h-dvh cursor-pointer flex-col bg-page p-5 text-ink md:p-12"
      onClick={() => !last && next()}
    >
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        {!data || !slide ? null : slide.kind === "intro" ? (
          <>
            <p className="text-6xl md:text-9xl">🏆</p>
            <p className="display mt-6 text-xl font-bold tracking-widest text-coral md:text-3xl">
              TAÇA DO GERÊS · A GRANDE FINAL
            </p>
            <h1 className="display mt-3 text-4xl font-bold md:text-8xl">Chegou a hora.</h1>
            <p className="mt-6 text-xl text-muted md:text-3xl">
              Três dias. Cento e tal missões. Zero confiança.
            </p>
          </>
        ) : slide.kind === "medal" ? (
          <div className="card-pop">
            <p className="text-6xl md:text-9xl">{slide.m.icone}</p>
            <p className="display mt-4 text-2xl font-bold tracking-widest text-coral md:text-4xl">
              {slide.m.titulo.toUpperCase()}
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Avatar name={slide.m.nome} emoji={slide.m.emoji} size={96} />
              <p className="display text-4xl font-bold md:text-7xl">{slide.m.nome}</p>
            </div>
            <p className="num mt-4 text-xl text-muted md:text-3xl">{slide.m.detalhe}</p>
          </div>
        ) : slide.kind === "podium" ? (
          <div className="card-pop">
            <p
              className={`display text-2xl font-bold tracking-widest md:text-4xl ${
                slide.gold ? "text-gold" : "text-coral"
              }`}
            >
              {slide.label}
            </p>
            <div className="mt-8 flex items-center justify-center gap-6">
              <Avatar
                name={slide.p.name}
                emoji={slide.p.emoji}
                size={slide.gold ? 180 : 120}
                className={slide.gold ? "border-8 border-gold" : ""}
              />
              <div className="text-left">
                <p
                  className={`display text-5xl font-bold md:text-8xl ${
                    slide.gold ? "text-gold" : ""
                  }`}
                >
                  {slide.p.name}
                </p>
                <p className="num mt-2 text-3xl text-muted md:text-5xl">
                  {slide.p.points} pontos
                </p>
              </div>
            </div>
            {slide.gold && (
              <p className="mt-10 text-5xl md:text-8xl">🏆🥇🎉</p>
            )}
          </div>
        ) : (
          <>
            <p className="text-6xl md:text-9xl">🌲</p>
            <h1 className="display mt-6 text-4xl font-bold md:text-7xl">
              Taça do Gerês 2026
            </h1>
            <p className="mt-4 text-xl text-muted md:text-3xl">
              Obrigado por desconfiarem uns dos outros. Até para o ano.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/tv");
              }}
              className="display mt-10 min-h-14 rounded-xl bg-coral px-10 text-2xl font-bold text-white md:min-h-20 md:px-16 md:text-4xl"
            >
              Agora… o vídeo 🎥
            </button>
          </>
        )}
      </main>

      <footer className="flex items-center justify-between">
        <p className="num text-lg text-muted md:text-2xl">
          {slides.length > 0 ? `${Math.min(i + 1, slides.length)}/${slides.length}` : ""}
        </p>
        <p className="display text-lg text-muted md:text-2xl">
          {last ? "" : "toca para avançar"}
        </p>
      </footer>
    </div>
  );
}
