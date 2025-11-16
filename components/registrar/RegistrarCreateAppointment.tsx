"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import { servicesPricing } from "@/lib/pricing";

type OwnerOption = {
  id: string;   // user_id в owner_profiles, строкой
  label: string;
};

type PetOption = {
  id: string;   // pets.id (uuid)
  label: string;
  species?: string | null;
};

export function RegistrarCreateAppointment() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Врач / услуга
  const [doctorId, setDoctorId] = useState<string>(
    doctors[0]?.id ?? ""
  );
  const [serviceCode, setServiceCode] = useState<string>(
    servicesPricing[0]?.code ?? ""
  );

  // Клиент (визуальные поля)
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");

  // Питомец
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");

  // Дата / время
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Яндекс Телемост
  const [videoUrl, setVideoUrl] = useState("");

  // Ошибка / загрузка
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  // Клиенты и их питомцы
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  const [pets, setPets] = useState<PetOption[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  // ===== 1. Подхватываем значения из query-параметров (если пришли из расписания) =====
  useEffect(() => {
    const qDoctor = searchParams.get("doctorId");
    const qDate = searchParams.get("date");
    const qTime = searchParams.get("time");
    const qService = searchParams.get("serviceCode");

    if (qDoctor) setDoctorId(qDoctor);
    if (qDate) setDate(qDate);
    if (qTime) setTime(qTime);
    if (qService) setServiceCode(qService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ===== 2. Загружаем клиентов =====
  useEffect(() => {
    let ignore = false;

    async function loadOwners() {
      const client = supabase;
      if (!client) {
        setOwnersLoading(false);
        return;
      }

      setOwnersLoading(true);
      const { data, error } = await client
        .from("owner_profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (!ignore) {
        if (!error && data) {
          const opts: OwnerOption[] = data.map((o: any) => ({
            id: String(o.user_id),
            label: o.full_name || `Клиент ${o.user_id}`,
          }));
          setOwners(opts);
          if (opts.length > 0) {
            setSelectedOwnerId(opts[0].id);
          }
        }
        setOwnersLoading(false);
      }
    }

    loadOwners();

    return () => {
      ignore = true;
    };
  }, []);

  // ===== 3. Загружаем питомцев выбранного клиента =====
  useEffect(() => {
    let ignore = false;

    async function loadPets() {
      const client = supabase;
      if (!client || !selectedOwnerId) {
        setPets([]);
        return;
      }

      setPetsLoading(true);

      const ownerKey = parseInt(selectedOwnerId, 10);
      if (Number.isNaN(ownerKey)) {
        setPets([]);
        setPetsLoading(false);
        return;
      }

      const { data, error } = await client
        .from("pets")
        .select("*")
        .eq("owner_id", ownerKey)
        .order("name", { ascending: true });

      if (!ignore) {
        if (!error && data) {
          const opts: PetOption[] = data.map((p: any) => ({
            id: String(p.id),
            label: p.name || "Без имени",
            species: p.species ?? null,
          }));
          setPets(opts);
        } else {
          setPets([]);
        }
        setPetsLoading(false);
      }
    }

    loadPets();

    return () => {
      ignore = true;
    };
  }, [selectedOwnerId]);

  // При выборе питомца подставляем его имя/вид, если поля пустые
  useEffect(() => {
    if (!selectedPetId) return;
    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    setPetName((prev) => prev || pet.label);
    setPetSpecies((prev) => prev || pet.species || "");
  }, [selectedPetId, pets]);

  // ===== 4. Submit =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const client = supabase;
    if (!client) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!serviceCode) {
      setErrorMessage("Выберите услугу.");
      return;
    }

    if (!date || !time) {
      setErrorMessage("Укажите дату и время приёма.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const startsAt = new Date(`${date}T${time}`);

    // owner_id — bigint
    let owner_id: number | null = null;
    if (selectedOwnerId) {
      const parsed = parseInt(selectedOwnerId, 10);
      if (!Number.isNaN(parsed)) {
        owner_id = parsed;
      }
    }

    const pet_id = selectedPetId || null;

    const { data, error } = await client
      .from("appointments")
      .insert({
        starts_at: startsAt.toISOString(),
        status: "запрошена",
        pet_name: petName || null,
        species: petSpecies || null,
        service_code: serviceCode,
        owner_id,
        pet_id,
        doctor_id: doctorId || null,
        contact_info: clientContact || null,
        video_platform: "yandex_telemost",
        video_url: videoUrl || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      setErrorMessage("Не удалось создать консультацию. Попробуйте ещё раз.");
      setSaving(false);
      return;
    }

    // сброс (минимальный)
    setClientName("");
    setClientContact("");
    setPetName("");
    setPetSpecies("");
    setDate("");
    setTime("");
    setSelectedPetId("");
    setVideoUrl("");

    setSaving(false);

    router.refresh();
    router.push(`/backoffice/registrar/consultations/${data.id}`);
  };

  const handleOpenTelemost = () => {
    if (typeof window !== "undefined") {
      window.open("https://telemost.yandex.ru/new", "_blank");
    }
  };

  // ===== RENDER =====
  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <h2 className="text-base font-semibold">
        Создать новую консультацию
      </h2>
      <p className="text-xs text-gray-500">
        Регистратор может создать запись на основании обращения клиента. При
        выборе клиента и питомца консультация будет привязана к их картотеке.
        Если вы пришли из расписания, врач, дата, время и услуга уже
        подставлены.
      </p>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-3 md:grid-cols-2"
      >
        {/* Клиент */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Клиент
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Клиент из картотеки (owner_profiles)
              </label>
              {ownersLoading ? (
                <div className="text-[11px] text-gray-400">
                  Загружаем клиентов…
                </div>
              ) : owners.length === 0 ? (
                <div className="text-[11px] text-gray-400">
                  Клиентов пока нет в таблице owner_profiles.
                </div>
              ) : (
                <select
                  value={selectedOwnerId}
                  onChange={(e) => {
                    setSelectedOwnerId(e.target.value);
                    setSelectedPetId("");
                  }}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Имя клиента (для заметки)
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Например, Иван Иванов"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Контакт (телефон / e-mail / Telegram)
              </label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="+7..., @username, email..."
              />
            </div>
          </div>
        </div>

        {/* Питомец */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Питомец
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Питомец из базы (pets)
              </label>
              {selectedOwnerId && petsLoading && (
                <div className="text-[11px] text-gray-400">
                  Загружаем питомцев…
                </div>
              )}
              {selectedOwnerId && !petsLoading && pets.length > 0 && (
                <select
                  value={selectedPetId}
                  onChange={(e) => setSelectedPetId(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="">Не выбрано</option>
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
              {selectedOwnerId && !petsLoading && pets.length === 0 && (
                <div className="text-[11px] text-gray-400">
                  У этого клиента пока нет ни одного питомца в таблице pets.
                </div>
              )}
              {!selectedOwnerId && (
                <div className="text-[11px] text-gray-400">
                  Сначала выберите клиента, чтобы увидеть его питомцев.
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Имя питомца
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Например, Мурзик"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Вид / порода
              </label>
              <input
                type="text"
                value={petSpecies}
                onChange={(e) => setPetSpecies(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
                placeholder="Кошка, шотландская; Собака, корги..."
              />
            </div>
          </div>
        </div>

        {/* Врач и услуга */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Врач и услуга
          </div>
          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Врач
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Услуга
              </label>
              <select
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              >
                {servicesPricing.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Формат связи: Телемост */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              Формат связи
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Яндекс Телемост
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Ссылка на Телемост
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1 rounded-xl border px-2 py-1.5 text-xs"
                  placeholder="https://telemost.yandex.ru/..."
                />
                <button
                  type="button"
                  onClick={handleOpenTelemost}
                  className="rounded-xl border border-emerald-600 px-2 py-1.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  Создать ссылку
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">
                Откроется новая вкладка Телемоста. Создайте конференцию и
                вставьте ссылку в поле.
              </p>
            </div>
          </div>
        </div>

        {/* Дата и время */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700">
            Дата и время
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Дата
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-500">
                Время
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          <p className="text-[10px] text-gray-400">
            Если вы пришли из расписания, дата и время уже подставлены. Их
            можно изменить вручную при необходимости.
          </p>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? "Создаём консультацию…" : "Создать консультацию"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
