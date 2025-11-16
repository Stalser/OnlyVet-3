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
  id: string;
  label: string;
};

type PetOption = {
  id: string;
  label: string;
  species?: string | null;
};

const SPECIES_OPTIONS = [
  "Собака",
  "Кошка",
  "Грызун",
  "Птица",
  "Рептилия",
  "Другое",
] as const;

const DOG_BREEDS = [
  "Метис",
  "Лабрадор ретривер",
  "Немецкая овчарка",
  "Йоркширский терьер",
  "Такса",
  "Чихуахуа",
  "Другая порода",
];

const CAT_BREEDS = [
  "Метис",
  "Британская короткошёрстная",
  "Шотландская вислоухая",
  "Мейн-кун",
  "Сфинкс",
  "Другая порода",
];

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

  // Слот, если пришли из расписания
  const [slotId, setSlotId] = useState<string | null>(null);

  // ФИО клиента
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");

  // Контакты
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientTelegram, setClientTelegram] = useState("");

  // Питомец
  const [petName, setPetName] = useState("");
  const [petSpeciesType, setPetSpeciesType] =
    useState<(typeof SPECIES_OPTIONS)[number]>("Кошка");
  const [petBreed, setPetBreed] = useState("");
  const [petSpeciesOther, setPetSpeciesOther] = useState("");
  const [petBreedOther, setPetBreedOther] = useState("");

  // Дата / время
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Телемост
  const [videoUrl, setVideoUrl] = useState("");

  // Ошибки / загрузка
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

  // ===== 1. Подхватываем данные из URL (расписание) =====
  useEffect(() => {
    const qDoctor = searchParams.get("doctorId");
    const qDate = searchParams.get("date");
    const qTime = searchParams.get("time");
    const qService = searchParams.get("serviceCode");
    const qSlotId = searchParams.get("slotId");

    if (qDoctor) setDoctorId(qDoctor);
    if (qDate) setDate(qDate);
    if (qTime) setTime(qTime);
    if (qService) setServiceCode(qService);
    if (qSlotId) setSlotId(qSlotId);
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
          if (opts.length > 0 && !selectedOwnerId) {
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
  }, [selectedOwnerId]);

  // ===== 3. Загружаем питомцев =====
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

  // Подстановка питомца
  useEffect(() => {
    if (!selectedPetId) return;
    const pet = pets.find((p) => p.id === selectedPetId);
    if (!pet) return;

    setPetName((prev) => prev || pet.label);
    if (pet.species) {
      setPetSpeciesType("Другое");
      setPetSpeciesOther(pet.species);
    }
  }, [selectedPetId, pets]);

  // ===== 4. Формируем строку вида/породы для БД =====
  const buildSpeciesString = () => {
    let baseSpecies: string;
    if (petSpeciesType === "Другое") {
      baseSpecies = petSpeciesOther || "другое";
    } else {
      baseSpecies = petSpeciesType;
    }

    let breedStr = "";
    if (petSpeciesType === "Собака") {
      if (petBreed === "Другая порода") {
        breedStr = petBreedOther || "";
      } else {
        breedStr = petBreed;
      }
    } else if (petSpeciesType === "Кошка") {
      if (petBreed === "Другая порода") {
        breedStr = petBreedOther || "";
      } else {
        breedStr = petBreed;
      }
    } else if (petSpeciesType === "Другое") {
      breedStr = petBreedOther || "";
    }

    if (breedStr) {
      return `${baseSpecies}, ${breedStr}`;
    }
    return baseSpecies;
  };

  // ===== 5. Submit =====
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const client = supabase;
    if (!client) {
      setErrorMessage("Supabase недоступен на клиенте.");
      return;
    }

    if (!clientEmail.trim() || !clientPhone.trim()) {
      setErrorMessage(
        "E-mail и телефон клиента обязательны для заполнения."
      );
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

    let owner_id: number | null = null;
    if (selectedOwnerId) {
      const parsed = parseInt(selectedOwnerId, 10);
      if (!Number.isNaN(parsed)) {
        owner_id = parsed;
      }
    }

    const pet_id = selectedPetId || null;

    const contactParts: string[] = [];
    if (clientEmail) contactParts.push(`email: ${clientEmail.trim()}`);
    if (clientPhone) contactParts.push(`phone: ${clientPhone.trim()}`);
    if (clientTelegram)
      contactParts.push(`telegram: ${clientTelegram.trim()}`);
    const contact_info = contactParts.join(" | ");

    const speciesString = buildSpeciesString();

    const { data, error } = await client
      .from("appointments")
      .insert({
        starts_at: startsAt.toISOString(),
        status: "запрошена",
        pet_name: petName || null,
        species: speciesString || null,
        service_code: serviceCode,
        owner_id,
        pet_id,
        doctor_id: doctorId || null,
        contact_info,
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

    if (slotId) {
      await client
        .from("doctor_slots")
        .update({ appointment_id: data.id, status: "busy" })
        .eq("id", slotId);
    }

    setPetName("");
    setPetSpeciesOther("");
    setPetBreed("");
    setPetBreedOther("");
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

  const currentBreedOptions =
    petSpeciesType === "Собака"
      ? DOG_BREEDS
      : petSpeciesType === "Кошка"
      ? CAT_BREEDS
      : ["Другая порода"];

  // ===== 6. Рендер =====

  return (
    <section className="rounded-2xl border bg_white p-4 space-y-4">
      <h2 className="text-base font-semibold">
        Создать новую консультацию
      </h2>
      <p className="text-xs text-gray-500">
        При создании из расписания врач, услуга, дата и время уже
        подставлены. Выберите клиента, питомца, заполните контакты и при
        необходимости скорректируйте данные.
      </p>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      >
        {/* Левая колонка: Клиент + Врач/услуга + Дата/время */}
        <div className="space-y-4">
          {/* Блок Клиент */}
          <div className="rounded-2xl border bg-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Клиент
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                из картотеки
              </span>
            </div>

            <div className="space-y-2">
              {/* Клиент из базы */}
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

              {/* ФИО в одну строку на десктопе */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  ФИО клиента (для заметки)
                </label>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl border px-2 py-1.5 text-xs"
                    placeholder="Фамилия"
                  />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl border px-2 py-1.5 text-xs"
                    placeholder="Имя"
                  />
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="rounded-xl border px-2 py-1.5 text-xs"
                    placeholder="Отчество"
                  />
                </div>
              </div>

              {/* Контакты */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-gray-600">
                  Контакты клиента
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full rounded-xl border px-2 py-1.5 text-xs"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full rounded-xl border px-2 py-1.5 text-xs"
                      placeholder="+7 900 000-00-00"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">
                      Telegram (ник, опционально)
                    </label>
                    <input
                      type="text"
                      value={clientTelegram}
                      onChange={(e) => setClientTelegram(e.target.value)}
                      className="w-full rounded-xl border px-2 py-1.5 text-xs"
                      placeholder="@username"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Блок Врач и услуга + Дата/время */}
          <div className="rounded-2xl border bg-white p-3 space-y-3">
            <div className="text-xs font-semibold text-gray-700">
              Врач, услуга и время
            </div>

            {/* Врач и услуга */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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

            {/* Дата и время */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-gray-600">
                Дата и время
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                Если вы пришли из расписания, дата и время выбраны по слоту.
                Их можно изменить вручную.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Создаём консультацию…" : "Создать консультацию"}
              </button>
            </div>
          </div>
        </div>

        {/* Правая колонка: Питомец + Телемост */}
        <div className="space-y-4">
          {/* Питомец */}
          <div className="rounded-2xl border bg-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">
                Питомец
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                из базы pets
              </span>
            </div>

            <div className="space-y-2">
              {/* Питомец из базы */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Питомец из картотеки
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
                    У этого клиента пока нет ни одного питомца.
                  </div>
                )}
                {!selectedOwnerId && (
                  <div className="text-[11px] text-gray-400">
                    Сначала выберите клиента, чтобы увидеть его питомцев.
                  </div>
                )}
              </div>

              {/* Имя питомца */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Имя питомца
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                  placeholder="Мурзик"
                />
              </div>

              {/* Вид */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Вид
                </label>
                <select
                  value={petSpeciesType}
                  onChange={(e) =>
                    setPetSpeciesType(
                      e.target.value as (typeof SPECIES_OPTIONS)[number]
                    )
                  }
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  {SPECIES_OPTIONS.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
                {petSpeciesType === "Другое" && (
                  <input
                    type="text"
                    value={petSpeciesOther}
                    onChange={(e) => setPetSpeciesOther(e.target.value)}
                    className="mt-2 w-full rounded-xl border px-2 py-1.5 text-xs"
                    placeholder="Уточните вид животного"
                  />
                )}
              </div>

              {/* Порода */}
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">
                  Порода
                </label>
                <select
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  className="w-full rounded-xl border px-2 py-1.5 text-xs"
                >
                  <option value="">Не указана</option>
                  {currentBreedOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {(petBreed === "Другая порода" ||
                  petSpeciesType === "Другое") && (
                  <input
                    type="text"
                    value={petBreedOther}
                    onChange={(e) => setPetBreedOther(e.target.value)}
                    className="mt-2 w-full rounded-xl border px-2 py-1.5 text-xs"
                    placeholder="Уточните породу"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Формат связи: Телемост */}
          <div className="rounded-2xl border bg-white p-3 space-y-3">
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
        </div>
      </form>
    </section>
  );
}
