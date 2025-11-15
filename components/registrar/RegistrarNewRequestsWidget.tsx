"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function RegistrarNewRequestsWidget() {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Первый запрос: сколько сейчас заявок со статусом "запрошена"
  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { count, error } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("status", "запрошена");

      if (!ignore) {
        if (!error && typeof count === "number") {
          setCount(count);
        } else {
          setCount(0);
        }
        setLoading(false);
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Realtime-подписка: реагируем на изменения в appointments
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("appointments_new_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        async (payload) => {
          // проще всего при каждом изменении пересчитать количество
          const { count, error } = await supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("status", "запрошена");

          if (!error && typeof count === "number") {
            setCount(count);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClick = () => {
    router.push("/backoffice/registrar/queue");
  };

  const badge =
    count === null || loading
      ? "—"
      : count === 0
      ? "0"
      : count > 99
      ? "99+"
      : String(count);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-left text-xs text-emerald-900 hover:border-emerald-300 hover:bg-emerald-100"
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-emerald-900">
          Новые заявки
        </span>
        <span className="text-[10px] text-emerald-800">
          Нажмите, чтобы открыть очередь и обработать.
        </span>
      </div>
      <div className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-bold text-emerald-700 shadow-sm">
        {badge}
      </div>
    </button>
  );
}
