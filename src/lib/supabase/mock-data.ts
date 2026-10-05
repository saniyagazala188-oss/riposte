// Sample data for the local preview (see mock.ts). Sized to stress the layouts:
// many competitors, signals, actions and prompts.

type Row = Record<string, unknown>;
const H = 3600_000;
const ago = (h: number) => new Date(Date.now() - h * H).toISOString();

let cache: Record<string, Row[]> | null = null;

export function mockTables(): Record<string, Row[]> {
  if (cache) return cache;
  const user_id = "u1";
  const names = [
    ["Acme Insights (demo)", "riposte-eta.vercel.app"],
    ["Crayon", "crayon.co"],
    ["Klue", "klue.com"],
    ["Visualping", "visualping.io"],
    ["Kompyte", "kompyte.com"],
    ["Contify", "contify.com"],
    ["Competitors App", "competitors.app"],
    ["Owler", "owler.com"],
    ["Similarweb", "similarweb.com"],
    ["SpyFu", "spyfu.com"],
    ["Semrush", "semrush.com"],
    ["Ahrefs", "ahrefs.com"],
    ["Brandwatch", "brandwatch.com"],
    ["Mention", "mention.com"],
    ["Prisync", "prisync.com"],
    ["Wiser", "wiser.com"],
    ["Valona", "valonaintelligence.com"],
    ["AlphaSense", "alpha-sense.com"],
    ["CB Insights", "cbinsights.com"],
    ["Crunchbase", "crunchbase.com"],
    ["Feedly", "feedly.com"],
    ["Meltwater", "meltwater.com"],
    ["Talkwalker", "talkwalker.com"],
    ["Sprout Social", "sproutsocial.com"],
  ];
  const competitors = names.map(([name, domain], i) => ({
    id: `c${i}`,
    user_id,
    name,
    domain,
    check_frequency: i < 4 ? "daily" : "weekly",
    discovery_note: null,
    created_at: ago(500 - i),
    sources: [{ count: 3 + (i % 4) }],
  }));
  const cname = (id: string) => ({ name: competitors.find((c) => c.id === id)!.name });

  const types = ["pricing", "blog", "feed", "sitemap", "changelog"];
  const sources = competitors.flatMap((c, i) =>
    types.slice(0, 3 + (i % 3)).map((t, k) => ({
      id: `s${i}_${k}`,
      user_id,
      competitor_id: c.id,
      type: t,
      url: `https://${c.domain}/${t === "feed" ? "feed.xml" : t === "sitemap" ? "sitemap.xml" : t}`,
      discovered: k < 3,
      last_checked_at: ago(5 + k),
      last_status: k === 4 && i % 5 === 0 ? "blocked" : "unchanged",
      last_error: k === 4 && i % 5 === 0 ? "The site blocked automated reading." : null,
      last_changed_at: ago(30 + i),
    })),
  );

  const posts = (c: number) =>
    [
      "AI battlecards that write themselves",
      "How to run a win-loss program in 30 days",
      "8 best practices for effective sales battlecards",
      "Competitive enablement for product marketers",
      "What's new: Slack alerts and Insights API",
      "The 2026 state of competitive intelligence",
      "Pricing pages that convert: 12 examples",
      "Battlecard rollout plan for sales teams",
    ].map((t, k) => ({ id: `p${c}_${k}`, title: t, link: `https://example.com/${c}/${k}`, date: ago(20 + k * 60 + c * 7) }));
  const sitemap = (c: number) => [
    ...Array.from({ length: 40 + c * 3 }, (_, k) => `https://site${c}.com/blog/post-${k}`),
    ...Array.from({ length: 6 + c }, (_, k) => `https://site${c}.com/compare/vs-rival-${k}`),
    ...Array.from({ length: 4 }, (_, k) => `https://site${c}.com/topics/question-${k}`),
    ...Array.from({ length: 12 }, (_, k) => `https://site${c}.com/customers/story-${k}`),
  ];
  const snapshots = sources
    .filter((s) => s.type === "feed" || s.type === "sitemap")
    .map((s, i) => ({
      id: `sn${i}`,
      source_id: s.id,
      fetched_at: ago(5),
      items: s.type === "feed" ? posts(Number(s.competitor_id.slice(1))) : sitemap(Number(s.competitor_id.slice(1))),
      lines: ["Pro $59 per month", "Enterprise: contact us"],
    }));

  const signalSeeds = [
    ["c0", "pricing", "high", "Acme raises Pro plan from $49 to $59 a month", "The Pro plan now costs $59 per month, up from $49. Enterprise is a new tier with SSO."],
    ["c0", "content", "high", "Acme Insights pivots blog post into a comparison list", "The 10-point checklist became 'The 10 best competitive intelligence tools in 2026, compared'."],
    ["c0", "product", "medium", "Acme launches AI-written battlecards", "The changelog lists AI battlecards that draft strengths and weaknesses from public pages."],
    ["c1", "product", "high", "Crayon ships a Field Agent for Slack", "Reps can ask Crayon's agent about a competitor inside Slack."],
    ["c1", "content", "medium", "Crayon publishes 3 posts on battlecard best practices", "New posts on rollout plans and battlecard templates."],
    ["c2", "positioning", "high", "Klue repositions around 'Compete Agent'", "The homepage headline now leads with an AI agent for competitive deals."],
    ["c2", "content", "medium", "Klue adds 6 answer pages for AI search", "New /topics/ pages answer buyer questions like 'Can ChatGPT build a battlecard?'"],
    ["c3", "pricing", "medium", "Visualping adds a Business plan at $140", "A new Business plan sits between Pro and Enterprise."],
    ["c4", "product", "low", "Kompyte updates its integrations page", "Two new integrations listed: HubSpot and Gong."],
    ["c5", "content", "low", "Contify posts a market report", "A 2026 market intelligence report is now gated behind a form."],
    ["c1", "pricing", "medium", "Crayon removes public pricing", "The pricing page now says 'Talk to sales' instead of listing tiers."],
    ["c2", "product", "medium", "Klue launches win-loss interviews", "A new win-loss product page with AI-run buyer interviews."],
  ];
  const kits: Row[] = [];
  const signals = signalSeeds.map(([cid, category, impact, title, what], i) => {
    const id = `sig${i}`;
    const change = {
      kind: category === "content" && i === 1 ? "rewrite" : category === "content" ? "new_posts" : "content",
      detected_at: ago(2 + i * 9),
      page_url: i === 1 ? "https://riposte-eta.vercel.app/demo/blog/competitive-intel-checklist" : null,
      added:
        category === "content" && i !== 1
          ? [{ title: "8 best practices for effective sales battlecards", link: "https://x.com/a" }, { title: "Battlecard rollout plan", link: "https://x.com/b" }]
          : ["Pro $59 per month", "Enterprise · SSO · Contact us", "AI battlecards included"],
      removed: category === "content" && i !== 1 ? [] : ["Pro $49 per month", "Battlecards (manual)"],
      sources: { type: category === "pricing" ? "pricing" : category === "content" ? "feed" : "changelog", url: "https://example.com/page" },
    };
    const items =
      i < 3
        ? ["battlecard", "comparison_page", "talk_track"].map((kind, k) => {
            const it = {
              id: `a${i}_${k}`,
              position: k,
              kind,
              title: ["Update the Acme pricing row in your battlecard", "Refresh 'Riposte vs Acme' with the new $59 price", "Brief sales: how to answer 'Acme is cheaper'"][k],
              why: "Their price went up, which widens your value gap for small teams.",
              channel: ["Battlecard in Notion", "Website /compare", "#sales Slack"][k],
              owner: ["PMM", "Content & SEO", "Sales"][k],
              priority: ["now", "this_week", "later"][(k + i) % 3],
              draft: "Acme now charges $59/month for Pro.\n\nWhat to say: [your price] and what you include that they don't: [differentiator].",
              status: i === 2 && k === 0 ? "done" : "open",
              done_at: null,
              created_at: ago(2 + i * 9),
              signal_id: id,
              competitor_id: cid,
              user_id,
            };
            kits.push({ ...it, competitors: cname(cid), signals: { title } });
            return it;
          })
        : [];
    return {
      id,
      user_id,
      created_at: ago(1 + i * 9),
      title,
      what_changed: what,
      so_what: "This matters for your small-team buyers: it changes how you compare on price and features.",
      action: "Update your comparison page and brief sales on the change this week.",
      impact,
      category,
      noise: i === 9,
      status: i === 5 ? "reviewed" : "new",
      competitor_id: cid,
      competitors: cname(cid),
      changes: change,
      action_items: items,
    };
  });
  // More actions for other competitors, to fill the board.
  for (let k = 0; k < 10; k++) {
    const cid = `c${1 + (k % 4)}`;
    kits.push({
      id: `ax${k}`,
      position: k,
      kind: ["blog_post", "social_post", "customer_email", "web_copy", "internal_update"][k % 5],
      title: ["Write 'AI battlecards compared' post", "LinkedIn post on Slack-native alerts", "Email at-risk accounts about the new tier", "Add an answer page for 'best CI tool for startups'", "Share the Klue repositioning with leadership"][k % 5],
      why: "Answers a competitor move that targets your buyers.",
      channel: "Blog",
      owner: ["Content & SEO", "PMM", "Customer success", "Content & SEO", "Leadership"][k % 5],
      priority: ["now", "this_week", "later"][k % 3],
      draft: "First draft…",
      status: k % 4 === 0 ? "done" : "open",
      created_at: ago(10 + k * 7),
      competitor_id: cid,
      competitors: cname(cid),
      signals: { title: signals[3 + (k % 6)].title },
      user_id,
    });
  }

  const changes = [
    { id: "ch1", user_id, kind: "new_pages", processed: false, detected_at: ago(1), added: ["https://klue.com/topics/best-ci-tools", "https://klue.com/topics/win-loss"], removed: [], page_url: null, competitor_id: "c2", competitors: cname("c2"), sources: { type: "sitemap", url: "https://klue.com/sitemap.xml" } },
  ];

  const stories = [
    { id: "st1", user_id, created_at: ago(3), title: "Acme is moving upmarket with AI battlecards", summary: "A price rise, a new Enterprise tier and an AI battlecard launch in the same week.", so_what: "Acme is leaving small teams behind, which is your core buyer.", action: "Publish a page for lean teams comparing Riposte and Acme on price and setup time.", signal_ids: ["sig0", "sig2", "sig1"], status: "new", competitor_id: "c0", competitors: cname("c0") },
    { id: "st2", user_id, created_at: ago(30), title: "Klue is betting on AI agents for deals", summary: "New homepage message and win-loss interviews built around an agent.", so_what: "Buyers will expect AI help in deals.", action: "Write a talk track on how Riposte drafts responses automatically.", signal_ids: ["sig5", "sig11"], status: "new", competitor_id: "c2", competitors: cname("c2") },
  ];
  const trends = [
    { id: "t1", user_id, created_at: ago(20), topic: "AI competitive agents and battlecards", summary: "Crayon, Klue and Acme all publish about AI agents that draft battlecards.", so_what: "Buyers now expect AI drafting.", action: "Publish a post contrasting AI alerts with drafted responses.", competitors: [{ id: "c1", name: "Crayon", titles: ["Field Agent for Slack"] }, { id: "c2", name: "Klue", titles: ["Meet Compete Agent"] }, { id: "c0", name: "Acme Insights (demo)", titles: ["AI battlecards that write themselves"] }], status: "new" },
    { id: "t2", user_id, created_at: ago(20), topic: "Sales battlecard best practices", summary: "Crayon and Klue both publish battlecard how-tos.", so_what: "A gap for a fast-start guide.", action: "Write a guide on cutting battlecard creation time in half.", competitors: [{ id: "c1", name: "Crayon", titles: ["8 best practices for effective sales battlecards"] }, { id: "c2", name: "Klue", titles: ["battlecard framework"] }], status: "new" },
  ];
  const content_topics = competitors.slice(0, 6).map((c) => ({
    competitor_id: c.id,
    generated_at: ago(40),
    source_count: 120,
    summary: `${c.name} writes mostly about competitive programs and battlecards.`,
    topics: [
      { name: "Competitive intelligence programs", count: 25, share: 21, summary: "How to start and scale a CI program.", examples: ["CI program in 30 days"] },
      { name: "Sales battlecards", count: 20, share: 17, summary: "Templates and rollout.", examples: ["Battlecard rollout plan"] },
      { name: "Win-loss analysis", count: 15, share: 12, summary: "Buyer interviews.", examples: ["Win-loss in 30 days"] },
    ],
  }));

  const topicsDef: [string, "shield" | "spear"][] = [
    ["Best competitive intelligence tools", "shield"],
    ["Competitor monitoring software", "shield"],
    ["Battlecard software", "shield"],
    ["Competitor alerts for content teams", "spear"],
    ["Auto-drafted responses to competitor launches", "spear"],
    ["AI search visibility tracking for competitors", "spear"],
  ];
  const dims = ["persona", "use_case", "constraint", "comparison", "authority", "specificity"];
  const ai_prompts = topicsDef.flatMap(([topic, kind], t) =>
    Array.from({ length: 10 }, (_, k) => ({
      id: `pr${t}_${k}`,
      user_id,
      topic,
      kind,
      dimension: dims[k % 6],
      text: `What is the best ${topic.toLowerCase()} option for a ${["solo product marketer", "content lead at a B2B SaaS startup", "team under $500 a month", "sales enablement manager", "agency tracking 20 clients"][k % 5]} who needs answers fast? (${k + 1})`,
      source: k === 9 && t === 3 ? "manual" : "ai",
      tracked: k < 2,
      position: t * 10 + k,
      created_at: ago(5),
    })),
  );
  const visibility_answers = ai_prompts
    .filter((p) => p.tracked)
    .map((p, i) => ({
      id: `va${i}`,
      user_id,
      prompt_id: p.id,
      run_at: ago(1),
      engine: "gemini-no-search",
      answer: "Here are strong options:\n\n1. **Klue** – best for enterprise enablement.\n2. **Crayon** – broad website tracking.\n3. **Kompyte** – affordable for small teams.\n4. **Visualping** – simple page change alerts.",
      queries: ["best competitive intelligence tool startup", "competitor monitoring software small team"],
      mentions: [
        ...(i === 1
          ? [
              { key: "c2", name: "Klue", position: 1 },
              { key: "c1", name: "Crayon", position: 2 },
              { key: "c4", name: "Kompyte", position: 3 },
            ]
          : [
              { key: "c2", name: "Klue", position: 1, known_for: ["enterprise sales enablement", "battlecards inside Salesforce"], you_match: "partly", gap: "Publish a page showing Riposte's action kits write battlecard updates and talk tracks automatically." },
              { key: "c1", name: "Crayon", position: 2, known_for: ["broad website change tracking"], you_match: "yes", gap: "Make daily competitor tracking visible on your homepage and in a comparison page against Crayon." },
              { key: "c4", name: "Kompyte", position: 3, known_for: [], you_match: "no", gap: "" },
            ]),
        ...(i % 3 === 0 ? [{ key: "other", name: "Contently", position: 4 }] : []),
        ...(i === 4 ? [{ key: "you", name: "Riposte", position: 5 }] : []),
      ],
      citations: [{ domain: "g2.com", title: "g2.com" }, { domain: "klue.com", title: "klue.com" }, { domain: "crayon.co", title: "crayon.co" }],
      you_mentioned: i === 4,
      you_position: i === 4 ? 5 : null,
      search_entry: null,
    }));

  const comparisons = [
    {
      competitor_id: "c0",
      user_id,
      generated_at: ago(30),
      signal_ids: ["sig2"],
      previous_content: null,
      previous_generated_at: null,
      content: {
        title: "Riposte vs Acme Insights: which fits a lean team?",
        meta_description: "Compare Riposte and Acme Insights on price, setup and AI features.",
        intro: "Riposte is for small product marketing and content teams. Acme Insights targets larger sales teams. Last updated 5 October 2026.",
        rows: [
          { criterion: "Pricing", you: "[Add your starting price]", them: "Pro $49 per month" },
          { criterion: "Best for", you: "PMMs and content leads", them: "Sales enablement teams" },
          { criterion: "Main job", you: "Explains changes and drafts responses", them: "Battlecards" },
          { criterion: "Setup", you: "Add a domain, pages found automatically", them: "Not published" },
        ],
        choose_you: ["You want responses drafted, not just alerts", "You are a small team"],
        choose_them: ["You need enterprise SSO", "Sales is the main user"],
        verdict: "Small teams should pick Riposte; large sales orgs may prefer Acme.",
        faq: [{ q: "Is Riposte cheaper than Acme?", a: "[Add your price]. Acme Pro is $49 a month." }],
      },
    },
  ];

  const profiles = [
    {
      id: user_id,
      email: "saniyagazala188@gmail.com",
      product_name: "Riposte",
      product_pitch: "Competitive intelligence that explains competitor moves and drafts your response",
      ideal_customer: "Product marketers and content leads at B2B SaaS startups",
      differentiators: "Drafts the response, not just the alert\nAI search visibility built in",
      email_alerts: true,
      weekly_digest: true,
      slack_webhook_url: "",
      aeo_keywords: "competitive intelligence tool\ncompetitor monitoring software",
      aeo_priorities: "Competitor alerts for content teams",
    },
  ];

  cache = {
    profiles,
    competitors,
    sources,
    snapshots,
    changes,
    signals,
    action_items: kits,
    stories,
    trends,
    content_topics,
    ai_prompts,
    visibility_answers,
    comparisons,
    page_outlines: [],
    waitlist: [
      { email: "priya@acmesaas.com", source: "landing", created_at: ago(0.2), approved_at: null, invited_at: null },
      { email: "rahul.pmm@example.com", source: "signed up", created_at: ago(1), approved_at: null, invited_at: null },
      { email: "meera@contentco.io", source: "landing", created_at: ago(3), approved_at: ago(2), invited_at: ago(2) },
    ],
    feedback: [
      {
        id: "f1",
        email: "meera@contentco.io",
        created_at: ago(1),
        uses_for: "Watching three competitors' blogs and pricing pages",
        miss_most: "The action kits. The talk track saved me an hour on Monday.",
        missing: "I'd like to share a signal with my sales lead in one click.",
        would_pay: "maybe",
        pay_amount: "$29 a month",
      },
    ],
    content_briefs: [
      {
        id: "b1",
        user_id,
        created_at: ago(2),
        source: "visibility",
        source_id: "pr0_0",
        topic: "What is the best competitive intelligence tool for a solo product marketer?",
        status: "new",
        content: {
          title: "The best competitive intelligence tool for a solo product marketer",
          meta_title: "Best Competitive Intelligence Tool for Solo PMMs",
          target_keyword: "competitive intelligence tool for product marketers",
          secondary_keywords: ["competitor tracking for small teams", "competitor monitoring tool", "battlecard software for startups"],
          intent: "commercial",
          intent_why: "The reader is choosing a tool and wants a recommendation.",
          angle: "Most lists compare enterprise tools built for sales. This one is for a marketer working alone, and judges tools on whether they draft the response.",
          quick_answer: "A solo product marketer needs a tool that watches competitors automatically and turns changes into ready-to-ship responses. Look for daily checks, explanations tied to your product, and drafts for battlecards and comparison pages.",
          outline: [
            { heading: "What a solo PMM actually needs", points: ["Time, not more dashboards", "Coverage of 3 to 5 rivals"] },
            { heading: "How we compared the tools", points: ["Setup time", "Explanations", "Drafted responses"] },
            { heading: "The options, side by side", points: ["Enterprise CI suites", "Page change monitors", "[Your product]"] },
            { heading: "Which one to choose", points: ["By team size", "By budget [add your price]"] },
          ],
          faqs: ["Do I need a competitive intelligence tool if I'm the only PMM?", "How much does a CI tool cost for a startup?", "Can ChatGPT track competitors for me?"],
          competitor_notes: "Klue and Crayon publish enterprise-focused guides; nobody writes for a solo marketer.",
          cta: "Try Riposte free on your top three competitors.",
        },
      },
    ],
  };
  return cache;
}
