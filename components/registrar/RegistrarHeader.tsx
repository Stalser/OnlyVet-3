"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabaseClient";

type StaffProfile = {
  full_name: string;
  position: string | null;
};

export function RegistrarHeader() {
  const { user, loading } = useCurrentUser();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!user || !supabase) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } = await supabase
        .from("staff_profiles")
        .select("full_name, position")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ignore) {
        if (!error && data) {
          setProfile({
            full_name: data.full_name,
            position: data.position,
          });
        }
        setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
        Загрузка профиля…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1 text-xs text-red-500">
        Ошибка авторизации
      </div>
    );
  }

  const roleLabel =
    user.role === "registrar"
      ? "Регистратор"
      : user.role === "vet"
      ? "Врач"
      : user.role === "admin"
      ? "Администратор"
      : "Пользователь";

  const name = profile?.full_name ?? roleLabel;
  const position = profile?.position ?? roleLabel;

  return (
    <div className="flex flex-col items-end text-right">
      <div className="text-xs text-gray-500">Сейчас работает</div>
      <div className="text-sm font-semibold text-gray-900">{name}</div>
      <div className="text-[11px] text-gray-500">{position}</div>
      <div className="text-[10px] leading-none text-gray-400">
        {user.email}
      </div>
    </div>
  );
}
