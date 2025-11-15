"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { AppUser, UserRole } from "./types";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      // 🔒 Проверяем, что supabase клиент существует
      if (!supabase) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 1. Получаем текущего авторизованного пользователя из auth
      const { data, error } = await supabase.auth.getUser();

      const authUser = data?.user ?? null;

      if (!authUser) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 2. Получаем роль пользователя из таблицы public.user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .maybeSingle();

      // если роли нет → считаем "client"
      const role: UserRole = (roleRow?.role as UserRole) ?? "client";

      if (!ignore) {
        setUser({
          id: authUser.id,
          email: authUser.email ?? null, // ⭐ фикc TypeScript: undefined → null
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
