"use client";

import { useEffect, useRef, useState } from "react";
import { post } from "@/lib/client";
import { MessageCircleQuestion, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "tg-ajuda-chat";

function load(): Msg[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// Chat de ajuda flutuante: pergunta como funciona qualquer coisa do jogo.
export default function AjudaChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMsgs(load()), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-12)));
    } catch {}
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, open]);

  async function enviar() {
    const q = text.trim();
    if (!q || busy) return;
    setText("");
    setBusy(true);
    const history = msgs.slice(-6);
    setMsgs((m) => [...m, { role: "user", content: q }]);
    const res = await post("/api/ajuda", { question: q, history });
    let answer = "O assistente não respondeu. Tenta outra vez.";
    if (res.ok) {
      const body = await res.json();
      if (body.answer) answer = body.answer;
      else if (body.error === "sem_chave")
        answer = "O assistente ainda não foi ligado (falta a chave da API).";
    }
    setMsgs((m) => [...m, { role: "assistant", content: answer }]);
    setBusy(false);
  }

  return (
    <>
      {/* botão flutuante, acima da barra de navegação */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ajuda"
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo text-white shadow-lg active:opacity-80"
        >
          <MessageCircleQuestion size={26} />
        </button>
      )}

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[75dvh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-page shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="display flex items-center gap-2">
              <MessageCircleQuestion size={18} className="text-indigo" /> Ajuda
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex min-h-11 min-w-11 items-center justify-center text-muted"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <div className="rounded-xl bg-surface p-3 text-sm text-muted">
                Pergunta-me qualquer coisa sobre o jogo: «como funciona o
                tribunal?», «quantas acusações tenho?», «o que é a prova no
                vídeo?»… (10 perguntas por dia por pessoa)
              </div>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-indigo text-white"
                    : "bg-surface text-ink"
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] rounded-xl bg-surface px-3 py-2 text-sm text-muted">
                a pensar…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              maxLength={300}
              placeholder="Como funciona…?"
              className="min-h-12 flex-1 rounded-full border border-line bg-surface px-4 text-ink"
            />
            <button
              onClick={enviar}
              disabled={busy || !text.trim()}
              aria-label="Enviar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-coral text-white disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
