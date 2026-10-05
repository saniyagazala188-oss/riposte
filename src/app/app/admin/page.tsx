import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { adminEmails, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteMessage } from "@/lib/invite";
import { card, inputClass, primaryButton } from "@/components/styles";
import { LinkTabs, PageHeader, PanelHead } from "@/components/ui";
import { SubmitButton } from "@/components/FormButtons";
import { timeAgo } from "@/lib/time";
import { approveEmail, unapproveEmail } from "./actions";

export const metadata = { title: "Admin · Riposte" };
export const dynamic = "force-dynamic";

type Row = { email: string; source: string | null; created_at: string; approved_at: string | null; invited_at: string | null };
type Feedback = {
  id: string;
  email: string | null;
  created_at: string;
  uses_for: string | null;
  miss_most: string | null;
  missing: string | null;
  would_pay: string | null;
  pay_amount: string | null;
};

const ERRORS: Record<string, string> = {
  key: "The SUPABASE_SERVICE_ROLE_KEY setting is missing, so the list can't be read.",
  email: "That doesn't look like an email address.",
  save: "Couldn't save the approval. Has migration 0014 been run?",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; approved?: string; mail?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();
  if (!isAdmin(user.email)) redirect("/app");
  const db = createAdminClient();

  const [{ data: list, error: listError }, { data: profiles }, { data: feedback }] = db
    ? await Promise.all([
        db.from("waitlist").select("email, source, created_at, approved_at, invited_at").order("created_at", { ascending: false }).limit(500),
        db.from("profiles").select("email").limit(2000),
        db.from("feedback").select("id, email, created_at, uses_for, miss_most, missing, would_pay, pay_amount").order("created_at", { ascending: false }).limit(200),
      ])
    : [{ data: null, error: null }, { data: null }, { data: null }];

  const rows = (list ?? []) as Row[];
  const signedUp = new Set((profiles ?? []).map((p) => String(p.email ?? "").toLowerCase()));
  const waiting = rows.filter((r) => !r.approved_at);
  const approved = rows.filter((r) => r.approved_at && !adminEmails().includes(r.email));
  const answers = (feedback ?? []) as Feedback[];
  const pay = { yes: 0, maybe: 0, no: 0 };
  for (const f of answers) if (f.would_pay && f.would_pay in pay) pay[f.would_pay as keyof typeof pay]++;

  const view = params.view === "approved" ? "approved" : params.view === "feedback" ? "feedback" : "waiting";
  const shown = view === "approved" ? approved : waiting;
  const justApproved = params.approved ? decodeURIComponent(params.approved) : "";

  return (
    <div>
      <PageHeader
        kicker="Admin · only you see this"
        title="Beta access"
        description="Approve people from the waitlist. Approved people can sign up and use Riposte, with beta limits of 5 competitors and 10 tracked prompts."
      />

      {params.error && <p className="mt-4 rounded-lg bg-signal-soft px-4 py-3 text-sm">{ERRORS[params.error] ?? "Something went wrong."}</p>}
      {listError && (
        <p className="mt-4 rounded-lg bg-signal-soft px-4 py-3 text-sm">
          Couldn&apos;t read the waitlist ({listError.message}). Has migration 0014 been run?
        </p>
      )}

      {justApproved && (
        <div className="mt-4 rounded-xl border border-accent bg-accent-soft p-4 text-sm">
          <p className="font-semibold">
            {justApproved} is approved.{" "}
            {params.mail === "sent" ? "The invite email is on its way." : "The invite email couldn't be sent, so send this yourself:"}
          </p>
          {params.mail !== "sent" && (
            <>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-3 font-sans text-sm">{inviteMessage(justApproved).text}</pre>
              <p className="mt-2 text-xs text-muted">
                Emails to other people need a verified sending domain in Resend. Until then, copy this into WhatsApp,
                LinkedIn or your own email.
              </p>
            </>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Waiting", waiting.length],
          ["Approved", approved.length],
          ["Signed up", approved.filter((r) => signedUp.has(r.email)).length],
          ["Feedback", answers.length],
        ].map(([k, v]) => (
          <div key={k} className={`${card} p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{k}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <form action={approveEmail} className={`${card} mt-6 flex flex-wrap items-end gap-3 p-4`}>
        <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
          <label htmlFor="add-email" className="text-sm font-semibold">
            Invite someone directly
          </label>
          <input id="add-email" name="email" type="email" required placeholder="name@company.com" className={inputClass} />
        </div>
        <input type="hidden" name="source" value="invited directly" />
        <SubmitButton pendingLabel="Approving…" className={primaryButton}>
          Approve and invite
        </SubmitButton>
      </form>

      <section className={`${card} mt-6 overflow-hidden`}>
        <div className="px-4 pt-3">
          <LinkTabs
            active={view}
            tabs={[
              { key: "waiting", label: "Waiting", count: waiting.length, href: "/app/admin" },
              { key: "approved", label: "Approved", count: approved.length, href: "/app/admin?view=approved" },
              { key: "feedback", label: "Feedback", count: answers.length, href: "/app/admin?view=feedback" },
            ]}
          />
        </div>

        {view === "feedback" ? (
          <>
            <PanelHead title="What beta users say" description={`Would pay: ${pay.yes} yes · ${pay.maybe} maybe · ${pay.no} no`} />
            <ul className="divide-y divide-line">
              {answers.map((f) => (
                <li key={f.id} className="px-4 py-4 text-sm">
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-ink">{f.email}</span> · {timeAgo(f.created_at)}
                    {f.would_pay && (
                      <>
                        {" "}
                        · would pay: <span className="font-semibold text-ink">{f.would_pay}</span>
                        {f.pay_amount && ` (${f.pay_amount})`}
                      </>
                    )}
                  </p>
                  {[
                    ["Uses it for", f.uses_for],
                    ["Would miss most", f.miss_most],
                    ["Missing or confusing", f.missing],
                  ].map(([k, v]) =>
                    v ? (
                      <p key={k} className="mt-1.5">
                        <span className="font-semibold">{k}: </span>
                        {v}
                      </p>
                    ) : null,
                  )}
                </li>
              ))}
              {!answers.length && <li className="px-4 py-6 text-center text-sm text-muted">No feedback yet.</li>}
            </ul>
          </>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((r) => (
              <li key={r.email} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.email}</p>
                  <p className="text-xs text-muted">
                    {r.source ?? "landing"} · joined {timeAgo(r.created_at)}
                    {r.approved_at && ` · approved ${timeAgo(r.approved_at)}`}
                    {r.approved_at && (signedUp.has(r.email) ? " · signed up" : " · not signed up yet")}
                    {r.invited_at && " · invite emailed"}
                  </p>
                </div>
                {r.approved_at ? (
                  <form action={unapproveEmail}>
                    <input type="hidden" name="email" value={r.email} />
                    <SubmitButton pendingLabel="…" className="text-xs font-medium text-muted hover:text-danger">
                      Remove access
                    </SubmitButton>
                  </form>
                ) : (
                  <form action={approveEmail}>
                    <input type="hidden" name="email" value={r.email} />
                    <input type="hidden" name="source" value={r.source ?? "landing"} />
                    <SubmitButton pendingLabel="Approving…" className={primaryButton}>
                      Approve
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
            {!shown.length && (
              <li className="px-4 py-6 text-center text-sm text-muted">
                {view === "waiting" ? "Nobody is waiting right now." : "Nobody approved yet."}
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
