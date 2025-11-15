"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { doctors } from "@/lib/data";
import { servicesPricing } from "@/lib/pricing";
import { useRouter } from "next/navigation";

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

  // врач / услуга
  const [doctorId, setDoctorId] = useState<string>(
    doctors[0]?.id ?? ""
  );
  const [serviceCode, setServiceCode] = useState<string>(
    servicesPricing[0]?.code ?? ""
  );

  // визуальные данные клиента (имя и контакт)
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");

  // питомец
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");

  // дата/время
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // ошибки/загрузка
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  // клиенты и их питомцы
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  const [pets, setPets] = useState<PetOption[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  // грузим клиентов
  useEffect(() => {
    let ignore = false;

    async function loadOwners() {
      if (!supabase) {
        setOwnersLoading(false);
        return;
      }

      setOwnersLoading(true);
      const { data, error } = await supabase
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

  // грузим питомцев выбранного клиента
  useEffect(() => {
    let ignore = false;

    async function loadPets() {
      if (!supabase || !selectedOwnerId) {
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

      const { data, error } = await supabase
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

  // при выборе питомца подставляем имя/вид при необходимости
  useEffect(() => {
    if (!selectedPetId) return;
    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    setPetName((prev) => prev || pet.label);
    setPetSpecies((prev) => prev || pet.species || "");
  }, [selectedPetId, pets]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!serviceCode || !date || !time) {
      setErrorMessage(
        "Заполните услугу, дату и время. Остальные поля — по возможности."
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const startsAt = new Date(`${date}T${time}`);

    // owner_id — bigint
    let owner_id: number | null = null;
    if (selectedOwnerId) {
      const parsed = parseInt(selectedOwnerId, 10);
      if (!Number.isNaN(parsed)) owner_id = parsed;
    }

    // pet_id — uuid
    const pet_id = selectedPetId || null;

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        starts_at: startsAt.toISOString(),
        status: "запрошена",
        pet_name: petName || null,
        species: petSpecies || null,
        service_code: serviceCode,
        owner_id,
        pet_id,
        contact_info: clientContact || null, // ← СЮДА сохраняем контакт!
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      setErrorMessage("Не удалось создать консультацию. Попробуйте ещё раз.");
      setSaving(false);
      return;
    }

    // сбрасываем форму
    setClientName("");
    setClientContact("");
    setPetName("");
    setPetSpecies("");
    setDate("");
    setTime("");
    setSelectedPetId("");

    setSaving(false);

    router.refresh();
    router.push(`/backoffice/registrar/consultations/${data.id}`);
  };

  return (
    <section className="rounded-2xl border bg-white p-4 space-y-4">
      <h2 className="text-base font-semibold">
        Создать новую консультацию
      </h2>
      <p className="text-xs text-gray-500">
        Регистратор может создать запись на основании обращения клиента.
        При выборе клиента и питомца консультация будет привязана к их
        картотеке.
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
                Имя клиента (для примечаний)
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
              <label className="mb-1 block text-[11px] text-gray-500}>
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
        {/* ... (блок питомца, врача и даты оставляем как в файле выше) */}
        {/* Чтобы не распухать ответ, ты можешь просто заменить весь файл на тот, который я дал выше */}
        
        {/* Я специально дал полный файл выше — просто вставь его целиком */}
      </form>
    </section>
  );
}
