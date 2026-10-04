// The Acme demo switches between two versions every 10 minutes. Pricing, blog feed and
// changelog switch together, so one check can catch a coordinated move ("linked signals").
export function demoVersion(now = Date.now()): 0 | 1 {
  return (Math.floor(now / (10 * 60 * 1000)) % 2) as 0 | 1;
}

const OLD_POSTS = [
  { slug: "competitive-intel-checklist", title: "A 10-point checklist for your first competitive intel program", date: "2026-08-12" },
  { slug: "pricing-page-teardown", title: "What 50 SaaS pricing pages taught us", date: "2026-07-22" },
  { slug: "win-loss-interviews", title: "How to run win-loss interviews that sales actually reads", date: "2026-06-30" },
];

const NEW_POSTS = [
  { slug: "introducing-ai-battlecards", title: "Introducing AI-written battlecards in Acme Pro", date: "2026-10-04" },
  { slug: "acme-enterprise", title: "Acme Enterprise: SSO, audit logs and a dedicated analyst", date: "2026-10-04" },
];

export function demoPosts(v: 0 | 1) {
  return v === 1 ? [...NEW_POSTS, ...OLD_POSTS] : OLD_POSTS;
}

export function demoChangelog(v: 0 | 1) {
  const base = [
    { date: "2026-09-18", title: "Slack alerts for pricing changes", body: "Get a Slack message when a tracked competitor changes its pricing page." },
    { date: "2026-08-29", title: "Weekly email summary", body: "A Monday email with every change from the past week." },
  ];
  return v === 1
    ? [
        { date: "2026-10-04", title: "AI-written battlecards (beta)", body: "Pro and Enterprise plans now draft a battlecard for each competitor and keep it updated." },
        { date: "2026-10-04", title: "SSO and audit logs", body: "New for Enterprise: single sign-on with Okta and Google, and a full audit log." },
        ...base,
      ]
    : base;
}
