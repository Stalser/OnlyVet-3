"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { RegistrarHeader } from "@/components/registrar/RegistrarHeader";
import { supabase } from "@/lib/supabaseClient";

type Owner = {
  user_id: number;
  full_name: string | null;
  city: string | null;
  extra_contacts: any;
  created_at: string | null;
};

type Pet = {
  id: string;
  name: string | null;
  species: string | null;
};

export default function ClientDetailPage() {
  const params = useParams();
  const idParam = params?.id as string;

  const [owner, setOwner] = useState<Owner | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);

      const ownerId = parseInt(idParam, 10);
      if (Number.isNaN(ownerId)) {
        setOwner(null);
        setPets([]);
        setLoading(false);
        return;
      }

      // загружаем клиента
      const { data: ownerData, error: ownerError } = await supabase
        .from("owner_profiles")
        .select("*")
        .eq("user_id", ownerId)
        .maybeSingle();

      // загружаем питомцев
      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name", { ascending: true });

      if (!ignore) {
        if (!ownerError && ownerData) {
          setOwner(ownerData as Owner);
        } else {
          setOwner(null);
        }

        if (!petsError && petsData) {
          setPets(petsData as Pet[]);
        } else {
          setPets([]);
        }

        setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [idParam]);

  return (
    <RoleGuard allowed={["registrar", "admin"]}>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Шапка */}
        <header className="flex items-center justify-between">
          <div>
            <Link
              href="/backoffice/clients"
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              ← К картотеке клиентов
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Клиент
            </h1>
            <p className="text-sm text-gray-500">
              Карточка клиента и список его питомцев. Пока только просмотр,
              функции редактирования появятся позже.
            </p>
          </div>
          <RegistrarHeader />
        </header>

        {loading && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-gray-500">Загрузка данных…</p>
          </section>
        )}

        {!loading && !owner && (
          <section className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-gray-500">
              Клиент с идентификатором{" "}
              <span className="font-mono">{idParam}</span> не найден.
            </p>
          </section>
        )}

        {!loading && owner && (
          <>
            {/* Основная информация о клиенте */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <h2 className="text-base font-semibold">Основная информация</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      ФИО
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {owner.full_name || "Без имени"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      Город
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-800">
                      {owner.city || "Не указан"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      ID клиента (user_id)
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800">
                      {owner.user_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500 mb-1">
                      Дата создания профиля
                    </div>
                    <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800">
                      {owner.created_at
                        ? new Date(owner.created_at).toLocaleString(
                            "ru-RU"
                          )
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Контакты (extra_contacts) */}
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-500 mb-1">
                    Контакты (из extra_contacts)
                  </div>
                  <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-800 whitespace-pre-wrap break-words">
                    {owner.extra_contacts
                      ? JSON.stringify(owner.extra_contacts, null, 2)
                      : "Контакты не указаны."}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    В будущем здесь можно будет красиво разобрать контакты
                    по полям (e-mail, телефон, Telegram) и редактировать
                    их прямо в интерфейсе.
                  </p>
                </div>
              </div>
            </section>

            {/* Питомцы клиента */}
            <section className="rounded-2xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Питомцы</h2>
                <button
                  type="button"
                  className="rounded-xl border border-gray-300 px-3 py-1.5 text-[11px] text-gray-500 cursor-not-allowed"
                  disabled
                >
                  Добавить питомца (скоро)
                </button>
              </div>

              {pets.length === 0 && (
                <p className="text-xs text-gray-400">
                  У этого клиента пока нет ни одного питомца в базе.
                </p>
              )}

              {pets.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left text-[11px] uppercase text-gray-500">
                        <th className="px-2 py-2">Имя</th>
                        <th className="px-2 py-2">Вид / порода</th>
                        <th className="px-2 py-2">Идентификатор</th>
                        <th className="px-2 py-2 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pets.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 align-top text-[11px] text-gray-800">
                            {p.name || "Без имени"}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-600">
                            {p.species || "Не указана"}
                          </td>
                          <td className="px-2 py-2 align-top text-[11px] text-gray-500 font-mono">
                            {p.id}
                          </td>
                          <td className="px-2 py-2 align-top text-right">
                            <span className="text-[10px] text-gray-400">
                              Редактировать / удалить (скоро)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </RoleGuard>
  );
}
