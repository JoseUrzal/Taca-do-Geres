"use client";

import Shell from "@/components/Shell";

// Regras no telemóvel — a versão de bolso da cerimónia de abertura.
export default function RegrasPage() {
  return (
    <Shell title="Regras">
      <div className="space-y-4">
        <Regra emoji="🏆" titulo="A Taça">
          Tudo dá pontos: missões, acusações, palpites e jogos físicos. É cada
          um por si: o campeão da Taça é coroado domingo à tarde. O marcador
          vive em <b>Taça</b> e na TV — toca num nome para veres o extrato de
          pontos de cada um. <b>Desempate no topo:</b> mais missões
          confirmadas; se persistir, ronda de quizz de morte súbita.
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
          <b>3 ❌ chumbam</b> e a missão arde sem pontos. Os votos são públicos
          e não podes votar no teu próprio caso.{" "}
          <b>Limite de cumplicidade:</b> no máximo <b>2 ✅ à mesma pessoa por
          dia</b> — a 3.ª confirmação não entra (cada um só tem 3 missões por
          dia; validar as 3 é demais). Os níveis de parceria estão públicos em
          Mais → Cumplicidades: 2 num dia «parceria? 🤔», 1 «suspeito 🧐», 0
          «tranqui 😌».
        </Regra>

        <Regra emoji="🎯" titulo="Acusações">
          Achas que alguém anda a tentar uma missão? Em <b>Acusar</b>, escolhe a
          pessoa e a missão do catálogo. Certo: <b>+15</b> e a missão dessa
          pessoa arde. Errado: <b>−5</b>. Só tens <b>2 por dia</b> — gasta-as
          com cabeça.
        </Regra>

        <Regra emoji="🤫" titulo="Quem sabe, cala ou acusa">
          Saber que alguém está em missão <b>não vale nada</b> por si só — e
          ninguém é obrigado a denunciar. Só duas coisas matam uma missão: uma{" "}
          <b>acusação formal certa</b> antes de cumprida, ou um <b>chumbo no
          Tribunal</b> depois de reclamada. Rumores e «eu já sabia» não contam.
          Quem desconfia tem duas opções: acusar já (arrisca −5, ganha +15) ou
          guardar a informação e votar ❌ quando o caso for a Tribunal — de
          borla, mas a precisar de mais 2 chumbos. A missão cumprida e
          reclamada antes de alguém a travar formalmente <b>é válida</b> e vai a
          julgamento como todas.
        </Regra>

        <Regra emoji="🎤" titulo="Quem Disse Isto?">
          Quando houver ronda (aparece «Ao vivo» no topo), responde à pergunta
          no telemóvel. Depois as respostas aparecem anónimas na TV e cada um
          adivinha quem escreveu o quê: <b>+5</b> por acerto, <b>+3</b> para ti
          por cada pessoa que enganares.
        </Regra>

        <Regra emoji="🏊" titulo="Jogos físicos">
          Saltos, olimpíadas, prova cega, os jogos que a malta trouxer… cada
          evento tem pódio de <b>15/10/5</b> pontos, registado na hora (por
          votação na app ou decisão direta). O Quizz tem limite de{" "}
          <b>4 rondas por dia</b>.
        </Regra>

        <Regra emoji="🎥" titulo="Quem vê, filma">
          Não há câmara oficial: se está a acontecer algo bom, <b>filma</b> —
          quem estiver mais perto. Um vídeo é a melhor prova no Tribunal: se
          duvidarem de uma missão tua, mostra-o antes da votação (vale combinar
          em segredo com alguém para te filmar). O botão{" "}
          <b>Guardar momento</b> na Casa não grava vídeo — aponta por escrito o
          que aconteceu, com autor e hora. Essa lista (Mais → Momentos) é o
          guião do vídeo de domingo: diz-nos o que aconteceu e a quem pedir as
          imagens.
        </Regra>

        <p className="rounded-lg border border-line bg-surface p-4 text-center text-sm text-muted">
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
    <section className="rounded-lg bg-surface p-4">
      <h2 className="display text-lg font-bold">
        {emoji} {titulo}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink/90">{children}</p>
    </section>
  );
}
