{/* ======= Питомец ======= */}
<section className="rounded-2xl border bg-white p-4 space-y-4">
  <div className="flex flex-wrap.items-center justify-between gap-3">
    <h2 className="text-base font-semibold">Питомец</h2>
    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.py-0.5">
        Слева — питомец для работы регистратуры
      </span>
      <span className="inline-flex items-center rounded-full bg-gray-50 px-2.py-0.5">
        Справа — питомец из заявки клиента
      </span>
    </div>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
    {/* Левая колонка: регистратура (редактируемая) */}
    <div className="space-y-1">
      <RegistrarPetEditor
        appointmentId={appointment.id}
        petName={appointment.petName ?? null}
        petSpecies={appointment.petSpecies ?? null}
      />
    </div>

    {/* Правая колонка: клиент (read-only) */}
    <div className="space-y-1">
      <div className="text-xs font-semibold uppercase text-gray-500">
        Питомец из заявки клиента
      </div>
      <div className="rounded-xl bg-white border border-dashed border-gray-200 p-3 text-sm space-y-1">
        <div className="font-medium">
          {appointment.requestedPetName || "не указан"}
        </div>
        {appointment.requestedPetSpecies && (
          <div className="text-xs text-gray-600">
            {appointment.requestedPetSpecies}
          </div>
        )}
        {!appointment.requestedPetName && !appointment.requestedPetSpecies && (
          <div className="text-[10px] text-gray-400 mt-1">
            Клиент не указал питомца при записи.
          </div>
        )}
      </div>
    </div>
  </div>
</section>
