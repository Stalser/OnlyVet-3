// app/auth/after-login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserRole = "client" | "vet" | "registrar" | "admin";

export default function AfterLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (!supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-gray-600">
          Supabase не сконфигурирован. Проверьте переменные окружения.
        </p>
      </main>
    );
  }

  const client: SupabaseClient = supabase;

  useEffect(() => {
    const run = async () => {
      setError(null);

      // 1. Берём текущего пользователя
      const { data: userData, error: userErr } = await client.auth.getUser();
      if (userErr) {
        console.error("AFTER LOGIN: getUser error", userErr);
        setError("Не удалось получить пользователя. Попробуйте войти заново.");
        router.replace("/auth/login");
        return;
      }

      const user = userData.user;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // ===============================
      // 2. Обеспечиваем owner_profile
      // ===============================

      try {
        // 2.1. Пытаемся найти профиль по auth_id
        const { data: byAuth, error: byAuthErr } = await client
          .from("owner_profiles")
          .select("user_id, full_name, auth_id, extra_contacts")
          .eq("auth_id", user.id)
          .maybeSingle();

        let ownerProfile: any = byAuth ?? null;

        if (byAuthErr) {
          console.error("AFTER LOGIN: owner by auth_id error", byAuthErr);
        }

        // 2.2. Если по auth_id не нашли — пытаемся связать по email
        if (!ownerProfile && user.email) {
          // Берём все профили (или можно потом ограничить по deleted_at и т.п.)
          const { data: owners, error: ownersErr } = await client
            .from("owner_profiles")
            .select("user_id, full_name, auth_id, extra_contacts");

          if (ownersErr) {
            console.error("AFTER LOGIN: owners load error", ownersErr);
          } else if (owners && owners.length > 0) {
            const emailLower = user.email.toLowerCase();

            const found = owners.find((o: any) => {
              if (!o.extra_contacts) return false;
              let extra: any = null;
              try {
                extra =
                  typeof o.extra_contacts === "string"
                    ? JSON.parse(o.extra_contacts)
                    : o.extra_contacts;
              } catch {
                extra = null;
              }
              if (!extra || typeof extra !== "object") return false;

              const candidateEmail =
                extra.email ?? extra.mail ?? extra.email_main ?? null;

              return (
                typeof candidateEmail === "string" &&
                candidateEmail.toLowerCase() === emailLower
              );
            });

            if (found) {
              // привязываем найденный профиль к auth_id
              const { error: linkErr } = await client
                .from("owner_profiles")
                .update({ auth_id: user.id })
                .eq("user_id", found.user_id);

              if (linkErr) {
                console.error("AFTER LOGIN: link owner_profile error", linkErr);
              } else {
                ownerProfile = { ...found, auth_id: user.id };
              }
            }
          }
        }

        // 2.3. Если всё ещё нет профиля — создаём новый owner_profile
        if (!ownerProfile) {
          const extra_contacts =
            user.email != null ? { email: user.email } : null;

          const { data: inserted, error: insertErr } = await client
            .from("owner_profiles")
            .insert({
              full_name: null,
              auth_id: user.id,
              extra_contacts,
            })
            .select("user_id, full_name, auth_id, extra_contacts")
            .single();

          if (insertErr) {
            console.error("AFTER LOGIN: owner insert error", insertErr);
          } else {
            ownerProfile = inserted;
          }
        }

        // ownerProfile дальше использовать не обязательно — главное, что он есть.
      } catch (e) {
        console.error("AFTER LOGIN: owner_profiles handling error", e);
      }

      // ===============================
      // 3. Роли из user_roles
      // ===============================

      const { data: rolesData, error: rolesErr } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (rolesErr) {
        console.error("AFTER LOGIN: roles error", rolesErr);
        // Если не смогли прочитать роли — считаем клиентом
        router.replace("/account");
        return;
      }

      const roles = (rolesData ?? []) as { role: UserRole }[];

      const hasVet = roles.some((r) => r.role === "vet");
      const hasRegistrar = roles.some((r) => r.role === "registrar");
      const hasAdmin = roles.some((r) => r.role === "admin");
      const hasClient = roles.some((r) => r.role === "client");

      // 4. Маршрутизация по ролям
      if (hasRegistrar) {
        router.replace("/backoffice/registrar");
      } else if (hasVet) {
        router.replace("/staff");
      } else if (hasAdmin) {
        router.replace("/backoffice/registrar");
      } else if (hasClient || roles.length === 0) {
        router.replace("/account");
      } else {
        router.replace("/account");
      }
    };

    void run();
  }, [client, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Определяем ваш профиль…</p>
        {error && (
          <p className="text-xs text-red-600 max-w-xs mx-auto">{error}</p>
        )}
      </div>
    </main>
  );
}
