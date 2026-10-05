// Who can do what during the invite-only beta.
// Admins are set in the ADMIN_EMAILS setting (comma-separated), kept out of the code.

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().includes(String(email).toLowerCase());
}

// Beta limits keep the free AI and email quotas healthy. Admins aren't limited.
export function limitsFor(email: string | null | undefined) {
  return isAdmin(email) ? { competitors: 30, trackedPrompts: 30 } : { competitors: 5, trackedPrompts: 10 };
}
