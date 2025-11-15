"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { AppUser } from "./types";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      // 1. Получаем auth пользователя
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 2. Получаем поле role из auth.users
      const { data: profile, error } = await supabase
        .from("profiles") // если у тебя таблицы profiles нет — заменим ниже
        .select("role")
        .eq("id", authUser.id)
        .single();

      const role = profile?.role ?? "client";

      if (!ignore) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          role,
        });
        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  return { user, loading };
}
