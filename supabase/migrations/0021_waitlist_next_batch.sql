-- Waitlist: a "next batch" state and a way to delete junk sign-ups.
-- next_batch_at: when the admin moved this person to the next batch (they get a polite email).
-- Delete: the admin page removes bot or junk rows, so the server needs delete access.

alter table public.waitlist add column if not exists next_batch_at timestamptz;

grant delete on public.waitlist to service_role;
