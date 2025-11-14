"use client";

import React from "react";

type PullToRefreshProps = {
  children: React.ReactNode;
  onRefresh?: () => void;
};

/**
 * Заглушка компонента PullToRefresh.
 * Просто рендерит children.
 */
export default function PullToRefresh({ children }: PullToRefreshProps) {
  return <div>{children}</div>;
}
