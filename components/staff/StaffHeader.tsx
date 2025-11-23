"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type StaffProfile = {
  full_name: string | null;
  position: string | null;
  doctor_id: string | null;
};

export function StaffHeader() {
  const { user, loading } = useCurrentUser();
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  useEffect(() => {
    let ignore = false;

    // если нет пользователя или supabase-клиента — профиля нет
    if (!user || !supabase) {
      if (!ignore) {
        setProfile(null);
      }
      return;
    }

    const client = supabase as SupabaseClient;

    async function load() {
      const { data, error } = await client
        .from("staff_profiles")
        .select("full_name, position, doctor_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ignore) {
        if (!error && data) {
          setProfile(data as StaffProfile);
        } else {
          setProfile(null);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-end text-xs text-gray-400">
        Загрузка профиля…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end text-xs text-red-500">
        Ошибка авторизации
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-xs text-gray-500">Сейчас работает</div>

      <div className="text-sm font-semibold text-gray-900">
        {profile?.full_name ?? "Врач"}
      </div>

      {profile?.position && (
        <div className="text-[11px] text-gray-500">{profile.position}</div>
      )}

      <div className="text-[10px] text-gray-400 leading-none">
        {user.email}
      </div>
    </div>
  );
}
