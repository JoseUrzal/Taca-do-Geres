"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fetcher, POLL } from "@/lib/client";
import { Home, ScrollText, Gavel, Crosshair, Trophy, Tv2, HelpCircle } from "lucide-react";

const TABS = [
  { href: "/casa", label: "Casa", icon: Home },
  { href: "/missoes", label: "Missões", icon: ScrollText },
  { href: "/tribunal", label: "Tribunal", icon: Gavel },
  { href: "/acusar", label: "Acusar", icon: Crosshair },
  { href: "/taca", label: "Taça", icon: Trophy },
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
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-pinhal-claro bg-granito/95 px-4 py-3 backdrop-blur">
        <h1 className="display text-2xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          {liveRound && (
            <Link
              href="/quem-disse"
              className="display flex min-h-11 items-center gap-1.5 rounded-md bg-rosa px-3 text-sm font-bold text-granito"
            >
              <Tv2 size={16} strokeWidth={2.5} /> Ao vivo
            </Link>
          )}
          {data && (
            <span className="num text-sm text-cal-fraca">Dia {data.day}</span>
          )}
          <Link
            href="/regras"
            aria-label="Regras"
            className="flex min-h-11 min-w-11 items-center justify-center text-cal-fraca"
          >
            <HelpCircle size={22} />
          </Link>
        </div>
      </header>

      <main className="px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-pinhal-claro bg-granito/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 pb-[env(safe-area-inset-bottom)] ${
                  active ? "text-rosa" : "text-cal-fraca"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="display text-[11px] font-bold">{label}</span>
                {href === "/tribunal" && badge > 0 && (
                  <span className="num absolute right-1/2 top-1 min-w-5 translate-x-5 rounded-full bg-rosa px-1 text-center text-xs font-bold text-granito">
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
