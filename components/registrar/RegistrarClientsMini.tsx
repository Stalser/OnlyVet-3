import Link from "next/link";

interface RegistrarClientsMiniProps {
  owners: any[];
}

export function RegistrarClientsMini({ owners }: RegistrarClientsMiniProps) {
  const total = owners.length;

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Краткая картотека клиентов
          </h2>
          <p className="text-[11px] text-gray-500">
            Быстрый доступ к последним клиентам. Полный список доступен в
            разделе &quot;Картотека клиентов&quot;.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-gray-500">
            Всего клиентов в системе:
          </div>
          <div className="text-xl font-semibold text-gray-900">
            {total}
          </div>
          <Link
            href="/backoffice/registrar/clients"
            className="mt-1 rounded-xl border border-emerald-600 px-3 py-1.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Открыть картотеку →
          </Link>
        </div>
      </div>

      {total === 0 && (
        <p className="text-xs text-gray-400">
          Клиентов пока нет. Они появятся после добавления через картотеку или
          автоматического создания при новых консультациях.
        </p>
      )}

      {total > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-gray-500">
            Последние клиенты:
          </p>
          <ul className="space-y-1">
            {owners.slice(0, 5).map((o: any) => {
              const id = o.id ?? o.user_id;
              const name =
                o.fullName ??
                o.full_name ??
                o.name ??
                "Без имени";
              const city = o.city ?? "—";
              const petsCount =
                o.petsCount ?? o.totalPets ?? o.petCount ?? 0;

              return (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Город: {city || "—"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] text-gray-500">
                      {petsCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100">
                          {petsCount}{" "}
                          {petsCount === 1
                            ? "питомец"
                            : petsCount < 5
                            ? "питомца"
                            : "питомцев"}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          нет питомцев
                        </span>
                      )}
                    </div>
                    {id && (
                      <Link
                        href={`/backoffice/registrar/clients/${id}`}
                        className="text-[10px] font-medium text-emerald-700 hover:underline"
                      >
                        Открыть →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
