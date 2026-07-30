"use client";

import { useEffect, useRef, useState } from "react";

// Número em mono tabular que faz flip quando o valor muda.
// A única animação da app. prefers-reduced-motion desliga-a via CSS.
export default function FlipNumber({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const prev = useRef(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 380);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span className={`num ${flipping ? "flip" : ""} ${className}`}>{value}</span>
  );
}
