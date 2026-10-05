"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { secondaryButton } from "@/components/styles";

// A submit button that shows a busy label while its form is being sent.
export function SubmitButton({
  children,
  pendingLabel,
  className = secondaryButton,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

// A delete button that asks for a second click before submitting.
export function ConfirmSubmit({ label, confirmLabel, pendingLabel = "Removing…" }: { label: string; confirmLabel: string; pendingLabel?: string }) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className={`${secondaryButton} text-danger`}>
        {label}
      </button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="submit" disabled={pending} className={`${secondaryButton} border-danger text-danger`}>
        {pending ? pendingLabel : confirmLabel}
      </button>
      <button type="button" onClick={() => setArmed(false)} className={secondaryButton}>
        Cancel
      </button>
    </span>
  );
}
