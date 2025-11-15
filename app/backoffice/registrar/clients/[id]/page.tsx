<section className="rounded-2xl border bg-white p-4 space-y-2">
  <h2 className="text-base font-semibold">
    Данные клиента
  </h2>
  <div className="text-sm">
    <div className="font-medium">
      {owner.full_name || owner.name || "Без имени"}
    </div>
    {owner.email && (
      <div className="text-gray-700 text-xs mt-1">
        {owner.email}
      </div>
    )}
    {owner.phone && (
      <div className="text-gray-700 text-xs">
        {owner.phone}
      </div>
    )}
    <div className="mt-2 text-[11px] text-gray-400">
      Поля owner_profiles могут быть донастроены — сейчас
      отображаем full_name / name / email / phone, если они
      есть.
    </div>
  </div>
</section>
