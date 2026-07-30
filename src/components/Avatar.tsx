"use client";

import { useState } from "react";

// Foto do jogador com fallback para emoji. As fotos vivem em
// public/avatars/<slug>.jpg — slug derivado do nome (José → jose,
// Joana M. → joana-m). Sem coluna na BD: convenção de nomes chega.
export function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Avatar({
  name,
  emoji,
  size = 40,
  className = "",
}: {
  name: string;
  emoji: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.62 }}
        aria-hidden
      >
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/avatars/${slugify(name)}.jpg`}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
