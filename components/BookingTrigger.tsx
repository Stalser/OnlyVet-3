"use client";

import BookingModal from "./BookingModal";

type BookingTriggerProps = {
  label?: string;
};

export default function BookingTrigger({ label = "Записаться" }: BookingTriggerProps) {
  return <BookingModal triggerLabel={label} />;
}
