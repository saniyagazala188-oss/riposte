// Riposte's public changelog: every step from the first plan to today.
// Times are India time (IST), taken from the build history. Newest entries go at the top.

export type ChangeEntry = {
  at: string; // ISO time with +05:30
  phase?: string;
  title: string;
  body: string;
  kind: "launch" | "feature" | "fix" | "decision";
  dateOnly?: boolean; // the exact time isn't recorded
};

export const CHANGELOG: ChangeEntry[] = [
  {
    at: "2026-10-05T23:30:00+05:30",
    title: "Blog, changelog and founder page",
    body: "A blog with SEO and AEO built in (quick answer box, FAQs, article and FAQ schema), this changelog, an about page, plus sitemap, robots and llms.txt.",
    kind: "feature",
  },
  {
    at: "2026-10-05T18:05:00+05:30",
    title: "Actions as a clear to-do list",
    body: "Tabs for Today, This week, Later and Done, a list on the left and the full action with its draft on the right.",
    kind: "feature",
  },
  {
    at: "2026-10-05T17:47:00+05:30",
    title: "Redesign for speed and scale",
    body: "Sidebar navigation, a list-and-detail feed with tabs, searchable and paged tables for 50+ competitors, side-by-side layouts, and password login.",
    kind: "feature",
  },
  {
    at: "2026-10-05T17:22:00+05:30",
    title: "AI visibility works on a free AI key",
    body: "When web search isn't available, answers fall back to the model's own knowledge, clearly labelled, with retries when Google is busy.",
    kind: "fix",
  },
  {
    at: "2026-10-05T16:52:00+05:30",
    phase: "Phase 9",
    title: "Living comparison pages",
    body: "Fair 'you vs them' pages written from facts on the competitor's site, flagged out of date when they change pricing or product, updated in one click.",
    kind: "launch",
  },
  {
    at: "2026-10-05T16:48:00+05:30",
    phase: "Phase 8",
    title: "AI visibility",
    body: "Tracked buyer questions are asked in Gemini. See which products get named, in what order, which sites the answers rely on, and where competitors are named and you aren't.",
    kind: "launch",
  },
  {
    at: "2026-10-05T16:44:00+05:30",
    phase: "Phase 7",
    title: "Prompt Studio",
    body: "Turns keywords into commercial-intent buyer prompts in Shield and Spear topics, with no brand names, checked by rules, and exported as CSV for Profound.",
    kind: "launch",
  },
  {
    at: "2026-10-05T16:40:00+05:30",
    title: "Clear history and Start fresh",
    body: "Reset a competitor's signals, or everything, without losing the pages being watched.",
    kind: "feature",
  },
  {
    at: "2026-10-05T15:56:00+05:30",
    phase: "Phase 6c",
    title: "Alerts when a page changes search intent",
    body: "Sitemap dates show when an old page is rewritten. Riposte compares its title and headings before and after, and flags shifts like a how-to guide becoming a 'best tools' comparison.",
    kind: "launch",
  },
  {
    at: "2026-10-05T15:21:00+05:30",
    title: "Smarter page discovery",
    body: "A page that redirects to the homepage is never accepted as pricing or blog. Answer pages built for AI search are recognised, and large sitemaps are read in full.",
    kind: "fix",
  },
  {
    at: "2026-10-04T23:26:00+05:30",
    phase: "Phase 6b",
    title: "Connected moves and trend alerts",
    body: "Related changes by one competitor are joined into one story. Topics that several competitors start writing about are flagged as trends.",
    kind: "launch",
  },
  {
    at: "2026-10-04T23:05:00+05:30",
    title: "Morning check never skips a competitor",
    body: "A competitor checked late the day before was skipped by the morning run. Daily pages are now due after 12 hours instead of 20.",
    kind: "fix",
  },
  {
    at: "2026-10-04T02:09:00+05:30",
    title: "Daily checks, plus Check now",
    body: "Decided against real-time checking. Competitors rarely change by the hour; daily checks catch what matters, keep costs low and are polite to their websites.",
    kind: "decision",
  },
  {
    at: "2026-10-04T01:07:00+05:30",
    phase: "Phase 6a",
    title: "Content intelligence",
    body: "How often each competitor publishes, what kinds of pages they have, and the topics they keep writing about, grouped by AI.",
    kind: "launch",
  },
  {
    at: "2026-10-04T00:17:00+05:30",
    title: "Actions board and shipped responses",
    body: "Every action from every kit in one place. Finishing a kit marks its signal reviewed, and the weekly digest lists the responses your team shipped.",
    kind: "feature",
  },
  {
    at: "2026-10-03T23:58:00+05:30",
    title: "What makes you different",
    body: "A new product profile field, so talk tracks and battlecards lead with your real strengths instead of generic lines.",
    kind: "feature",
  },
  {
    at: "2026-10-03T23:44:00+05:30",
    title: "AI that copes with busy servers",
    body: "When Google's AI is overloaded, Riposte retries and falls back to a lighter model, and shows the real reason if it still fails.",
    kind: "fix",
  },
  {
    at: "2026-10-03T23:23:00+05:30",
    phase: "Phase 5",
    title: "Action kits",
    body: "For each signal: what to create, who owns it, where to share it and how urgent it is, with a first draft ready to copy.",
    kind: "launch",
  },
  {
    at: "2026-10-03T23:11:00+05:30",
    title: "First live signal and email alert",
    body: "The demo competitor raised its price from $49 to $59. Riposte caught it, explained it as high impact and emailed the alert.",
    kind: "decision",
  },
  {
    at: "2026-10-03T22:00:00+05:30",
    title: "A demo competitor for testing",
    body: "A fictional company, Acme Insights, whose pricing, blog and changelog change every 10 minutes, so every feature can be tested end to end.",
    kind: "feature",
  },
  {
    at: "2026-10-03T21:27:00+05:30",
    phase: "Phase 4",
    title: "AI signals, alerts and the weekly digest",
    body: "Each real change is explained against your product: what changed, why it matters, what to do and how important it is. High-impact changes are emailed, and a digest arrives every Monday.",
    kind: "launch",
  },
  {
    at: "2026-10-03T18:57:00+05:30",
    phase: "Phase 3",
    title: "The fetcher",
    body: "Reads each page every morning, keeps only the main content, compares it with the last check and ignores noise like dates, banners and menus. Respects each site's robots.txt.",
    kind: "launch",
  },
  {
    at: "2026-10-03T01:21:00+05:30",
    phase: "Phase 2",
    title: "Your product and competitors",
    body: "Describe your product and buyers once. Add a competitor by its website, and Riposte finds its pricing page, blog, feed, release notes and sitemap.",
    kind: "launch",
  },
  {
    at: "2026-10-03T00:47:00+05:30",
    phase: "Phase 1",
    title: "Riposte goes live",
    body: "Login, a secure database, and a landing page with a waitlist, live on the web.",
    kind: "launch",
  },
  {
    at: "2026-10-02T12:00:00+05:30",
    dateOnly: true,
    title: "The plan",
    body: "Wrote down the problem from my own PMM work, designed the user flow and screens, and split the build into nine phases, each tested live before the next.",
    kind: "decision",
  },
];
