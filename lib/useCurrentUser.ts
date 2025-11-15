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

      // 🔒 защита от null: если по типу supabase может быть null — просто выходим
      if (!supabase) {
        if (!ignore) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 1. Берём текущего auth-пользователя
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

      // 2. Берём роль из public.user_roles
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .maybeSingle();

      const role: UserRole = (roleRow?.role as UserRole) ?? "client";

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
