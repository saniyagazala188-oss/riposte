"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { WaitlistForm } from "@/components/WaitlistForm";
import { makeBattlecard, type ToolState } from "./actions";
import type { Battlecard } from "@/lib/tools/battlecard";

const initial: ToolState = { status: "idle" };
const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-base outline-none focus:border-accent";
const label = "text-sm font-semibold";

// The card as plain text, for copying into Notion, Google Docs or Confluence.
function asText(c: Battlecard, product: string) {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return [
    `${product} vs ${c.competitor}: battlecard`,
    `\nWHO THEY ARE\n${c.who_they_are}`,
    `\nWHO THEY SELL TO\n${c.who_they_sell_to}`,
    `\nWHY WE WIN\n${list(c.why_we_win)}`,
    `\nWHY WE LOSE\n${list(c.why_we_lose)}`,
    `\nPRICING\n${c.pricing}`,
    `\nOBJECTIONS\n${c.objections.map((o) => `They say: ${o.they_say}\nYou say: ${o.you_say}`).join("\n\n")}`,
    `\nQUESTIONS TO ASK\n${list(c.questions)}`,
    `\nPROOF TO ADD\n${list(c.proof)}`,
    `\nCHECK BEFORE USING\n${list(c.check_these)}`,
    `\nLast checked: ${new Date().toISOString().slice(0, 10)}`,
  ].join("\n");
}

function Section({ title, children, tone = "" }: { title: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className={`rounded-xl border border-line p-4 ${tone}`}>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-1.5">
    {items.map((x) => (
      <li key={x} className="flex gap-2">
        <span className="text-accent" aria-hidden>
          •
        </span>
        {x}
      </li>
    ))}
  </ul>
);

export function BattlecardTool() {
  const [state, action, pending] = useActionState(makeBattlecard, initial);
  const [shownAt, setShownAt] = useState("");
  // Controlled fields, so nothing is lost when the form is sent (React resets uncontrolled ones).
  const [product, setProduct] = useState("");
  const [yourSite, setYourSite] = useState("");
  const [about, setAbout] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [copied, setCopied] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => setShownAt(String(Date.now())), []);
  useEffect(() => {
    if (state.status === "done") {
      track("battlecard_generated");
      result.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state]);

  const copy = async (c: Battlecard) => {
    await navigator.clipboard.writeText(asText(c, product || "Us"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <input type="hidden" name="t" value={shownAt} />
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="bc-website">Website</label>
          <input id="bc-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-product" className={label}>
              Your product
            </label>
            <input id="bc-product" name="product" required maxLength={80} className={input} placeholder="e.g. Acme Insights" value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bc-your-site" className={label}>
              Your website <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="bc-your-site" name="your_site" value={yourSite} onChange={(e) => setYourSite(e.target.value)} className={input} placeholder="yourproduct.com" inputMode="url" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bc-about" className={label}>
            What your product does, and who it&apos;s for
          </label>
          <textarea
            id="bc-about"
            name="about"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            required
            rows={2}
            maxLength={400}
            className={input}
            placeholder="e.g. Tracks competitor pricing for small SaaS marketing teams and drafts the battlecard update"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bc-competitor" className={label}>
            Competitor&apos;s website
          </label>
          <input id="bc-competitor" name="competitor" value={competitor} onChange={(e) => setCompetitor(e.target.value)} required className={input} placeholder="competitor.com" inputMode="url" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-5 py-3 font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Reading their site and writing your card…" : "Generate my battlecard"}
          </button>
          <span className="text-sm text-muted">{pending ? "About 20 to 40 seconds" : "Free · no sign-up · 3 cards a day"}</span>
        </div>
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      </form>

      {state.status === "done" && (
        <div ref={result} className="mt-8 scroll-mt-24 rounded-2xl border-2 border-accent bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Battlecard</p>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {product || "You"} vs {state.card.competitor}
              </h2>
            </div>
            <button type="button" onClick={() => copy(state.card)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-accent">
              {copied ? "Copied ✓" : "Copy as text"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Section title="Who they are">{state.card.who_they_are}</Section>
            <Section title="Who they sell to">{state.card.who_they_sell_to}</Section>
            <Section title="Why we win" tone="bg-accent-soft/60">
              <Bullets items={state.card.why_we_win} />
            </Section>
            <Section title="Why we lose" tone="bg-signal-soft/60">
              <Bullets items={state.card.why_we_lose} />
            </Section>
            <div className="md:col-span-2">
              <Section title="Pricing">{state.card.pricing}</Section>
            </div>
            <div className="md:col-span-2">
              <Section title="Objections">
                <dl className="flex flex-col gap-3">
                  {state.card.objections.map((o) => (
                    <div key={o.they_say} className="grid gap-1 md:grid-cols-2 md:gap-4">
                      <dt>
                        <span className="font-semibold">They say:</span> {o.they_say}
                      </dt>
                      <dd>
                        <span className="font-semibold text-accent">You say:</span> {o.you_say}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            </div>
            <Section title="Questions to ask">
              <Bullets items={state.card.questions} />
            </Section>
            <Section title="Proof to add">
              <Bullets items={state.card.proof} />
            </Section>
            <div className="md:col-span-2">
              <Section title="Check before you use it" tone="bg-bg">
                <Bullets items={state.card.check_these} />
                <p className="mt-3 text-xs text-muted">
                  Written by AI from {state.sources.join(" and ")}. Check the facts before sharing it with sales.
                </p>
              </Section>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl bg-accent px-5 py-5 text-accent-ink">
            <p className="font-display text-xl font-bold">This card goes out of date the day {state.card.competitor} changes something.</p>
            <p className="text-accent-ink/90">
              Riposte watches their pricing, launches, blog and news every morning, and drafts the exact battlecard update. Free during the beta.
            </p>
            <div className="rounded-lg bg-surface p-3 text-ink">
              <WaitlistForm id="bc-join" />
            </div>
          </div>
          {state.left > 0 && <p className="mt-3 text-center text-sm text-muted">You can make {state.left} more today.</p>}
        </div>
      )}
    </div>
  );
}
