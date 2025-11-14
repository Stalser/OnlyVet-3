"use client";

import Link from "next/link";

type BookingModalProps = {
  triggerLabel?: string;
  doctorId?: string;
  serviceCode?: string;
};

export default function BookingModal({
  triggerLabel = "Записаться",
  doctorId,
  serviceCode,
}: BookingModalProps) {
  const params = new URLSearchParams();
  if (doctorId) params.set("doctor", doctorId);
  if (serviceCode) params.set("service", serviceCode);

  const href = `/booking${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <Link
      href={href}
      className="rounded-xl px-6 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900"
    >
      {triggerLabel}
    </Link>
  );
}
