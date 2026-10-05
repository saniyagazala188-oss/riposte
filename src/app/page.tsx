import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { WaitlistForm } from "@/components/WaitlistForm";
import { createClient } from "@/lib/supabase/server";

const problems = [
  {
    title: "Repetitive",
    body: "Export each competitor from your SEO tool, compare it with last week's sheet, paste what's new. Every week, for every competitor.",
  },
  {
    title: "Inconsistent",
    body: "Which competitors get checked depends on the week, and a page that reappears is assumed to be \"optimized\" without anyone seeing what changed.",
  },
  {
    title: "Reactive",
    body: "Shifts in search intent and trending topics show up late, as interruptions that push half-finished work back.",
  },
];

const steps = [
  { title: "Add a competitor by domain", body: "Riposte finds their release notes, blog feed and pricing page for you." },
  { title: "It checks every day", body: "Each page is compared with the last check. Timestamps, banners and other noise are ignored." },
  { title: "It explains the change", body: "What changed, what it means for your product, and how much it matters." },
  { title: "It tells you what to make", body: "The assets to create, where each one goes, and who owns it, with first drafts ready." },
];

const features = [
  ["Signal feed and alerts", "Real changes only, with a before/after view. High-impact moves go to email or Slack the morning they're found."],
  ["Action kits", "A response plan for every signal: what to create, where it goes, who owns it, with first drafts ready to edit. All actions in one list: Today, This week, Later."],
  ["Content intelligence", "Competitors' publishing pace, page mix and topics, rewritten pages that change search intent, and topics trending across competitors."],
  ["Content briefs", "One click turns a trend, or an AI answer you're missing from, into a brief: keyword, intent, angle, quick answer, outline and FAQs."],
  ["Living comparisons", "Fair \"you vs them\" pages written from what's on their site, flagged out of date when they change pricing or product."],
  ["Prompt Studio", "Buyer prompts for AI search from your keywords: commercial intent only, no brand names, ready to export."],
  ["AI visibility", "Your buyers' questions asked in Gemini: who gets named, in what order, and which sites the answers rely on."],
  ["Why they're winning", "When AI names competitors and not you, see what it picks each one for, whether your product says the same, and what to publish to compete."],
  ["Weekly digest", "A Monday email with the week's moves and the responses your team shipped."],
];

function ExampleSignal() {
  return (
    <div className="w-full rounded-2xl border border-line bg-surface p-5 shadow-sm" aria-label="Example signal">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted">Example signal</span>
        <span className="rounded-full border border-current px-2 py-0.5 font-semibold text-signal">High impact</span>
        <span className="font-mono text-muted">Pricing · 2 days ago</span>
      </div>
      <p className="mt-3 font-display text-lg font-bold leading-snug">
        Pipewise removed its free plan and raised Starter from $9 to $12 per seat.
      </p>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-bg p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">So what</p>
          <p className="mt-1">Small teams that started on their free plan now have no free option. That opens your entry segment.</p>
        </div>
        <div className="rounded-lg bg-signal-soft p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">What to make</p>
          <p className="mt-1">Update your comparison page, brief sales, and launch a switch offer this week.</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Pipewise is a fictional company used for illustration.</p>
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const signedIn = supabase ? Boolean((await supabase.auth.getUser()).data.user) : false;
  return (
    <div className="min-h-dvh">
      <SiteHeader signedIn={signedIn} />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Competitive intelligence for marketers</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              Every competitor move deserves a sharp reply.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Riposte watches your competitors&apos; launches, content and pricing every day. It tells you what changed,
              what it means for you, and what to do about it. It also shows who AI recommends to your buyers, and why
              it isn&apos;t you yet.
            </p>
            <div className="mt-7">
              <WaitlistForm id="hero-email" />
              <p className="mt-2 text-sm text-muted">Early access is free for the first teams. No sales call.</p>
            </div>
          </div>
          <ExampleSignal />
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="max-w-2xl font-display text-3xl font-bold">
              Competitor research quietly eats a product marketer&apos;s week.
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              It pulls time away from the real job: positioning, stakeholder conversations, and being visible in Google
              and AI answers.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {problems.map((p) => (
                <div key={p.title} className="border-t-2 border-ink pt-4">
                  <h3 className="font-display text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-muted">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-display text-3xl font-bold">How Riposte works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2">
                <span className="font-mono text-sm text-accent">0{i + 1}</span>
                <h3 className="font-display text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="font-display text-3xl font-bold">What you get</h2>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {features.map(([name, body]) => (
              <div key={name} className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
                <dt className="font-semibold">{name}</dt>
                <dd className="text-muted">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-accent-soft">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-14">
            <h2 className="font-display text-3xl font-bold">Get early access</h2>
            <p className="max-w-xl text-muted">
              Riposte is being built in public. Join the waitlist and be one of the first teams to try it on your own
              competitors. Follow along on the{" "}
              <Link href="/blog" className="font-medium text-accent hover:underline">blog</Link> and the{" "}
              <Link href="/changelog" className="font-medium text-accent hover:underline">changelog</Link>.
            </p>
            <WaitlistForm id="footer-email" />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
