import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { adminEmails, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteMessage } from "@/lib/invite";
import { card, inputClass, primaryButton, secondaryButton } from "@/components/styles";
import { LinkTabs, PageHeader, PanelHead } from "@/components/ui";
import { SubmitButton } from "@/components/FormButtons";
import { nextBatchMessage, removedMessage } from "@/lib/nextBatch";
import { DeleteChoice } from "./DeleteChoice";
import { pageLabel } from "@/lib/joinSource";
import { timeAgo } from "@/lib/time";
import { approveEmail, deleteFromWaitlist, moveToNextBatch, unapproveEmail } from "./actions";
import { CopyInvite } from "./CopyInvite";
import { SurveyResults, type SurveyRow } from "./SurveyResults";

export const metadata = { title: "Admin · Riposte" };
export const dynamic = "force-dynamic";

type Row = { email: string; source: string | null; created_at: string; approved_at: string | null; invited_at: string | null; next_batch_at?: string | null };
type Feedback = {
  id: string;
  email: string | null;
  created_at: string;
  uses_for: string | null;
  miss_most: string | null;
  missing: string | null;
  would_pay: string | null;
  pay_amount: string | null;
  expected?: string | null;
  page_url?: string | null;
  browser?: string | null;
  screenshot_paths?: string[] | null;
};

const ERRORS: Record<string, string> = {
  key: "The SUPABASE_SERVICE_ROLE_KEY setting is missing, so the list can't be read.",
  email: "That doesn't look like an email address.",
  save: "Couldn't save the approval. Has migration 0014 been run?",
  batch: "Couldn't move them to the next batch. Has migration 0021 been run?",
  delete: "Couldn't delete them. Has migration 0021 been run?",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; approved?: string; batched?: string; deleted?: string; mail?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();
  if (!isAdmin(user.email)) redirect("/app");
  const db = createAdminClient();

  // Reads the waitlist with the "next batch" date, or without it if migration 0021 hasn't run yet.
  const readList = async () => {
    if (!db) return { data: null, error: null };
    const cols = "email, source, created_at, approved_at, invited_at";
    const q = (c: string) => db.from("waitlist").select(c).order("created_at", { ascending: false }).limit(500);
    const withBatch = await q(`${cols}, next_batch_at`);
    return withBatch.error ? await q(cols) : withBatch;
  };
  const [{ data: list, error: listError }, { data: profiles }, { data: feedback }, { data: surveyRows }] = db
    ? await Promise.all([
        readList(),
        db.from("profiles").select("email").limit(2000),
        db.from("feedback").select("*").order("created_at", { ascending: false }).limit(200),
        db
          .from("beta_survey")
          .select("user_id, email, answered_at, dismissed_at, emailed_at, before_tool, most_useful, disappointment, fair_price, missing, call_ok")
          .order("answered_at", { ascending: false, nullsFirst: false })
          .limit(500),
      ])
    : [{ data: null, error: null }, { data: null }, { data: null }, { data: null }];
  const survey = (surveyRows ?? []) as SurveyRow[];

  const rows = (list ?? []) as unknown as Row[];
  const signedUp = new Set((profiles ?? []).map((p) => String(p.email ?? "").toLowerCase()));
  const waiting = rows.filter((r) => !r.approved_at && !r.next_batch_at);
  const nextBatch = rows.filter((r) => !r.approved_at && r.next_batch_at);
  const approved = rows.filter((r) => r.approved_at && !adminEmails().includes(r.email));
  // Count of sign-ups per page, busiest first (admins left out).
  const joinedFrom = Object.entries(
    rows
      .filter((r) => !adminEmails().includes(r.email))
      .reduce<Record<string, number>>((acc, r) => {
        const k = pageLabel(r.source);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const answers = (feedback ?? []) as Feedback[];
  // Screenshots are private: make short-lived links for the ones on this page.
  const shotPaths = answers.flatMap((f) => f.screenshot_paths ?? []);
  const shotUrls = new Map<string, string>();
  if (db && shotPaths.length) {
    const { data: signed } = await db.storage.from("reports").createSignedUrls(shotPaths, 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) shotUrls.set(s.path, s.signedUrl);
  }
  const pay = { yes: 0, maybe: 0, no: 0 };
  for (const f of answers) if (f.would_pay && f.would_pay in pay) pay[f.would_pay as keyof typeof pay]++;

  const view =
    params.view === "approved" ? "approved" : params.view === "next" ? "next" : params.view === "feedback" ? "feedback" : params.view === "survey" ? "survey" : "waiting";
  const shown = view === "approved" ? approved : view === "next" ? nextBatch : waiting;
  const justApproved = params.approved ? decodeURIComponent(params.approved) : "";
  const justBatched = params.batched ? decodeURIComponent(params.batched) : "";
  const justDeleted = params.deleted ? decodeURIComponent(params.deleted) : "";

  return (
    <div>
      <PageHeader
        kicker="Admin · only you see this"
        title="Beta access"
        description="Approve people from the waitlist. Approved people can sign up and use Riposte, with beta limits of 5 competitors and 10 tracked prompts."
        actions={
          <Link href="/app/admin/ai-bots" className={secondaryButton}>
            AI bot visits →
          </Link>
        }
      />

      {params.error && <p className="mt-4 rounded-lg bg-signal-soft px-4 py-3 text-sm">{ERRORS[params.error] ?? "Something went wrong."}</p>}
      {listError && (
        <p className="mt-4 rounded-lg bg-signal-soft px-4 py-3 text-sm">
          Couldn&apos;t read the waitlist ({listError.message}). Has migration 0014 been run?
        </p>
      )}

      {justApproved && (
        <div className="mt-4 rounded-xl border border-accent bg-accent-soft p-4 text-sm">
          <p className="font-semibold">✓ {justApproved} is approved and can now use Riposte.</p>
          {params.mail === "sent" ? (
            <p className="mt-1 text-muted">They&apos;ve been emailed an invite.</p>
          ) : (
            <>
              <p className="mt-1 text-muted">
                Riposte couldn&apos;t email them yet (that needs a verified sending domain), so let them know yourself.
                Copy this message and send it to them on WhatsApp, LinkedIn or email.
              </p>
              <CopyInvite text={inviteMessage(justApproved).text} />
            </>
          )}
        </div>
      )}

      {justBatched && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="font-semibold">✓ {justBatched} is in the next batch.</p>
          {params.mail === "sent" ? (
            <p className="mt-1 text-muted">They&apos;ve been emailed that their spot is saved. Find them under the Next batch tab when you&apos;re ready to approve.</p>
          ) : (
            <>
              <p className="mt-1 text-muted">The email didn&apos;t go out, so you can send this message yourself.</p>
              <CopyInvite text={nextBatchMessage().text} label="Copy the message" />
            </>
          )}
        </div>
      )}
      {justDeleted &&
        (params.mail === "sent" ? (
          <p className="mt-4 rounded-lg bg-bg px-4 py-3 text-sm text-muted">Removed {justDeleted} from the waitlist and sent them a short note.</p>
        ) : params.mail === "failed" || params.mail === "off" ? (
          <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-semibold">Removed {justDeleted}, but the note didn&apos;t go out.</p>
            <p className="mt-1 text-muted">You can send it yourself:</p>
            <CopyInvite text={removedMessage().text} label="Copy the note" />
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-bg px-4 py-3 text-sm text-muted">Deleted {justDeleted} from the waitlist. No email was sent.</p>
        ))}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Waiting", waiting.length],
          ["Approved", approved.length],
          ["Signed up", approved.filter((r) => signedUp.has(r.email)).length],
          ["Problems", answers.length],
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
              { key: "next", label: "Next batch", count: nextBatch.length, href: "/app/admin?view=next" },
              { key: "approved", label: "Approved", count: approved.length, href: "/app/admin?view=approved" },
              { key: "feedback", label: "Problems", count: answers.length, href: "/app/admin?view=feedback" },
              { key: "survey", label: "Survey", count: survey.filter((r) => r.answered_at).length, href: "/app/admin?view=survey" },
            ]}
          />
        </div>

        {view === "survey" ? (
          <SurveyResults rows={survey} />
        ) : view === "feedback" ? (
          <>
            <PanelHead
              title="Problem reports"
              description={pay.yes + pay.maybe + pay.no ? `Older feedback, would pay: ${pay.yes} yes · ${pay.maybe} maybe · ${pay.no} no` : "What beta users reported as broken or wrong"}
            />
            <ul className="divide-y divide-line">
              {answers.map((f) => (
                <li key={f.id}>
                  {/* One line per report; click to see everything, including screenshots. */}
                  <details className="group px-4 py-2.5 text-sm">
                    <summary className="flex cursor-pointer list-none items-center gap-3 marker:hidden">
                      <span className="inline-block text-muted transition group-open:rotate-90">›</span>
                      <span className="w-48 shrink-0 truncate font-semibold">{f.email}</span>
                      <span className="w-32 shrink-0 whitespace-nowrap text-muted">{timeAgo(f.created_at)}</span>
                      <span className="min-w-0 flex-1 truncate">{f.missing ?? f.miss_most ?? f.uses_for ?? "–"}</span>
                      {(f.screenshot_paths ?? []).length > 0 && (
                        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                          {(f.screenshot_paths ?? []).length} screenshot{(f.screenshot_paths ?? []).length > 1 ? "s" : ""}
                        </span>
                      )}
                    </summary>
                    <div className="mt-2 rounded-lg bg-bg p-3">
                      {f.would_pay && (
                        <p className="text-xs text-muted">
                          Older feedback · would pay: <span className="font-semibold text-ink">{f.would_pay}</span>
                          {f.pay_amount && ` (${f.pay_amount})`}
                        </p>
                      )}
                      {(f.miss_most || f.would_pay
                        ? [
                            ["Uses it for", f.uses_for],
                            ["Would miss most", f.miss_most],
                            ["Missing or confusing", f.missing],
                          ]
                        : [
                            ["Problem", f.missing],
                            ["Expected", f.expected ?? null],
                            ["Where", f.uses_for],
                            ["Came from", f.page_url ?? null],
                            ["Browser", f.browser ?? null],
                          ]
                      ).map(([k, v]) =>
                        v ? (
                          <p key={k} className={`mt-1.5 first:mt-0 ${k === "Browser" ? "text-xs text-muted" : ""}`}>
                            <span className="font-semibold">{k}: </span>
                            {v}
                          </p>
                        ) : null,
                      )}
                      {(f.screenshot_paths ?? []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(f.screenshot_paths ?? []).map((p) =>
                            shotUrls.get(p) ? (
                              <a key={p} href={shotUrls.get(p)} target="_blank" rel="noreferrer" className="block h-24 w-36 overflow-hidden rounded-lg border border-line">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={shotUrls.get(p)} alt="Screenshot" className="h-full w-full object-cover" />
                              </a>
                            ) : (
                              <span key={p} className="rounded-lg border border-line px-3 py-2 text-xs text-muted">Screenshot unavailable</span>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </li>
              ))}
              {!answers.length && <li className="px-4 py-6 text-center text-sm text-muted">No problems reported yet.</li>}
            </ul>
          </>
        ) : (
          <ul className="divide-y divide-line">
            {joinedFrom.length > 0 && (
              <li className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs">
                <span className="font-semibold text-muted">Where people joined:</span>
                {joinedFrom.map(([label, n]) => (
                  <span key={label} className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">
                    {label} · {n}
                  </span>
                ))}
              </li>
            )}
            {shown.map((r) => (
              <li key={r.email} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.email}</p>
                  <p className="text-xs text-muted">
                    {pageLabel(r.source)} · joined {timeAgo(r.created_at)}
                    {r.next_batch_at && !r.approved_at && ` · moved to next batch ${timeAgo(r.next_batch_at)}`}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={deleteFromWaitlist}>
                      <input type="hidden" name="email" value={r.email} />
                      <input type="hidden" name="view" value={view} />
                      <DeleteChoice />
                    </form>
                    {!r.next_batch_at && (
                      <form action={moveToNextBatch}>
                        <input type="hidden" name="email" value={r.email} />
                        <SubmitButton pendingLabel="Moving…">Next batch</SubmitButton>
                      </form>
                    )}
                    <form action={approveEmail}>
                      <input type="hidden" name="email" value={r.email} />
                      <input type="hidden" name="source" value={r.source ?? "landing"} />
                      <SubmitButton pendingLabel="Approving…" className={primaryButton}>
                        Approve
                      </SubmitButton>
                    </form>
                  </div>
                )}
              </li>
            ))}
            {!shown.length && (
              <li className="px-4 py-6 text-center text-sm text-muted">
                {view === "waiting" ? "Nobody is waiting right now." : view === "next" ? "Nobody in the next batch yet." : "Nobody approved yet."}
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
