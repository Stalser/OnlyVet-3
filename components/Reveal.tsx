"use client";

import React from "react";

type RevealProps = {
  children: React.ReactNode;
};

/**
 * Заглушка анимационного компонента Reveal.
 * Пока просто показывает children без анимации.
 */
export default function Reveal({ children }: RevealProps) {
  return <>{children}</>;
}
