"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tg-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Tema claro" : "Tema escuro"}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted active:bg-surface-2"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
