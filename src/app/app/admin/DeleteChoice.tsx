"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { secondaryButton } from "@/components/styles";

// Delete asks how: a bot gets no email, a real person gets a short, kind note.
export function DeleteChoice() {
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${secondaryButton} text-danger`}>
        Delete
      </button>
    );
  }
  if (pending) return <span className="text-sm text-muted">Removing…</span>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="submit" name="note" value="0" className={`${secondaryButton} border-danger text-danger`}>
        Delete (bot, no email)
      </button>
      <button type="submit" name="note" value="1" className={`${secondaryButton} border-danger text-danger`}>
        Remove with a note
      </button>
      <button type="button" onClick={() => setOpen(false)} className={secondaryButton}>
        Cancel
      </button>
    </span>
  );
}
