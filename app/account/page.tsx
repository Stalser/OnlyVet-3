function AppointmentRow({ a }: { a: Appointment }) {
  const statusColor =
    a.status === "подтверждена"
      ? "text-emerald-700 bg-emerald-50"
      : a.status === "запрошена"
      ? "text-amber-700 bg-amber-50"
      : a.status === "завершена"
      ? "text-gray-700 bg-gray-50"
      : "text-red-700 bg-red-50";

  return (
    <tr className="border-b border-gray-50 hover:bg-slate-50">
      <td className="py-2 pr-3">{a.date}</td>
      <td className="py-2 pr-3">{a.time}</td>
      <td className="py-2 pr-3">
        {a.petName} <span className="text-gray-500">({a.species})</span>
      </td>
      <td className="py-2 pr-3">{a.doctorName}</td>
      <td className="py-2 pr-3">{a.serviceName}</td>
      <td className="py-2 pr-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusColor}`}
        >
          {a.status}
        </span>
      </td>
      <td className="py-2 pr-3">
        <Link
          href={`/account/appointment/${a.id}`}
          className="text-[11px] text-blue-600 underline underline-offset-2"
        >
          Подробнее
        </Link>
      </td>
    </tr>
  );
}
