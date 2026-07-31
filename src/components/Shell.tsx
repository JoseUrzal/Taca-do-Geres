"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher, POLL } from "@/lib/client";
import ThemeToggle from "./ThemeToggle";
import { Home, Gavel, Trophy, Menu, Tv2 } from "lucide-react";

// 4 separadores, mais nada. O resto são sub-páginas acessíveis a partir
// destes (Acusar e Quem Disse a partir da Casa; catálogo/regras em Mais).
const TABS = [
  { href: "/casa", label: "Casa", icon: Home },
  { href: "/tribunal", label: "Tribunal", icon: Gavel },
  { href: "/taca", label: "Taça", icon: Trophy },
  { href: "/mais", label: "Mais", icon: Menu },
];

export default function Shell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // mesma key que /casa → dedupe do SWR, sem pedidos extra
  const { data } = useSWR("/api/casa", fetcher, POLL);
  const badge = data?.tribunal_pending ?? 0;
  const liveRound = !!data?.active_round;

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-page px-4 py-2">
        <h1 className="display text-xl text-indigo">{title}</h1>
        <div className="flex items-center gap-1">
          {liveRound && (
            <Link
              href="/quem-disse"
              className="display mr-1 flex min-h-10 items-center gap-1.5 rounded-md bg-coral px-3 text-sm text-white"
            >
              <Tv2 size={15} strokeWidth={2.5} /> Ao vivo
            </Link>
          )}
          {data && <span className="num px-1 text-sm text-muted">Dia {data.day}</span>}
          <ThemeToggle />
        </div>
      </header>

      <main className="px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-page pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex h-16 flex-1 select-none flex-col items-center justify-center gap-1 ${
                  active ? "text-indigo" : "text-muted"
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className="display text-xs">{label}</span>
                {href === "/tribunal" && badge > 0 && (
                  <span className="num absolute right-1/2 top-1.5 min-w-5 translate-x-6 rounded-full bg-coral px-1 text-center text-xs font-bold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
