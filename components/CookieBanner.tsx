"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "onlyvet_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // показываем баннер только, если ещё не было согласия
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    }
  }, []);

  function accept() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "accepted");
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30">
      <div className="container mb-4">
        <div className="rounded-2xl bg-gray-900 text-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div>
            Мы используем cookies для улучшения работы сервиса и анализа
            обращений. Продолжая пользоваться сайтом, вы соглашаетесь с этим.
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={accept}
              className="px-3 py-1 rounded-xl bg-white text-gray-900 text-xs font-medium"
            >
              Хорошо
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
