"use client";

import Link from "next/link";
import Shell from "@/components/Shell";
import { ScrollText, Video, HelpCircle, Tv2, Settings, ChevronRight } from "lucide-react";

const LINKS = [
  { href: "/missoes", label: "Catálogo de missões", desc: "Tudo o que anda em jogo", icon: ScrollText },
  { href: "/momentos", label: "Momentos", desc: "O guião do vídeo de domingo", icon: Video },
  { href: "/regras", label: "Regras", desc: "Como se joga, em 2 minutos", icon: HelpCircle },
  { href: "/tv", label: "Modo TV", desc: "Para pôr na televisão", icon: Tv2 },
  { href: "/admin", label: "Admin", desc: "Só para quem manda (PIN)", icon: Settings },
];

export default function MaisPage() {
  return (
    <Shell title="Mais">
      <ul className="space-y-2">
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-16 items-center gap-4 rounded-xl bg-surface px-4 active:bg-surface-2"
            >
              <Icon size={22} className="shrink-0 text-indigo" />
              <span className="flex-1">
                <span className="display block">{label}</span>
                <span className="block text-sm text-muted">{desc}</span>
              </span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">
        Taça do Gerês · 31 jul — 2 ago 2026
      </p>
    </Shell>
  );
}
