# Build log

What was built in each phase, what broke, and what was fixed.
This is the honest record behind the project, kept as we go.

## Phase 0 · The prototype (before the real build)

**What it was:** a single-page prototype with competitors, a signal feed and a leadership digest.

**What broke:** it couldn't fetch competitor pages on its own. The page ran in a sandbox that blocks requests to other websites, so every check needed the user to copy and paste the page text by hand. Every counter showed zero until someone pasted something, which defeated the point of a monitoring tool.

**What we changed:** moved to a real web app with a server that fetches pages on a schedule (Next.js on Vercel, Supabase for the data). The prototype stays as a design reference only.

**Lessons for the real build:**
- Competitor pages are full of noise (timestamps, cookie banners, rotating testimonials). Comparing whole pages produces false alerts, so the fetcher must compare main content only.
- A dashboard nobody opens doesn't help. Alerts and the digest must reach people in email or Slack.

## Phase 1 · Setup

**Goal:** login, database, landing page with waitlist, live address on Vercel.

**Built:**
- Next.js + TypeScript + Tailwind project
- Magic-link login with Supabase (no passwords)
- `profiles` table, created automatically for each new user, with Row Level Security so each user sees only their own data
- `waitlist` table: anyone can join, nobody can read the list through the app
- Protected `/app` area: signed-out visitors are sent to the login page
- Responsive landing page with the waitlist form

**Decisions:**
- New Supabase tables are not exposed automatically; each table gets only the access the app needs.
- The public pages still load if the Supabase settings are missing, so a configuration mistake never takes the whole site down.

**What broke / fixed:**
- **Fonts failed to download during the build.** The build server couldn't reach Google Fonts, so the build stopped. Fixed by bundling the fonts with the app (self-hosted), which also makes pages load without a call to Google.
- **The app page was being built as a static page.** Next.js tried to pre-build `/app` once, but it has to check who is logged in on every visit. Fixed by marking it as dynamic.
- **Login emails need the live address.** Supabase only sends people back to addresses it trusts, so the Vercel address had to be added as the Site URL and `/auth/callback` as a Redirect URL.

**Tested on the live site (riposte-eta.vercel.app), 3 Oct 2026:**
- Joining the waitlist works, and the email appears in the `waitlist` table.
- Login by email link works, and lands in the workspace.

**Still rough:** the first login email is Supabase's generic "Confirm your email address" message. A branded email and our own email sender come with the alerts in phase 4.

## Phase 2 · Your product and competitors

**Goal:** a user describes their product and adds competitors by typing a domain. Riposte finds the pages worth watching on its own.

**Built:**
- **Your product** page: product name, one-line pitch, who you sell to. Every signal will be judged against this.
- **Competitors** page: add a competitor by website (for example `acme.com`). The name is filled in automatically if left empty. Up to 10 competitors for now, to keep AI costs predictable.
- **Automatic page discovery**, in two passes:
  1. Read the homepage and look for links to pricing, changelog or release notes, and the blog, plus any blog feed (RSS) the site declares.
  2. For anything still missing, try common addresses (`/pricing`, `/changelog`, `/blog`, `/feed`, `/rss.xml`, `/sitemap.xml`).
- **Competitor page**: shows every page being watched, marks which were found automatically and which were added by hand, lists what's still missing and why it matters, and lets the user add, remove or re-find pages, set daily or weekly checks, or remove the competitor.
- Setup checklist on the home screen.
- New tables `competitors` and `sources`, each row owned by one user, with Row Level Security.

**Decisions:**
- A feed or sitemap only counts if the response really is a feed or sitemap. Many sites answer every address with a normal "page not found" page that still returns success, which would otherwise be saved as a fake feed.
- Every request has a 6-second time limit and a size limit, and identifies itself as RiposteBot, so one slow site can't hang the app.
- Links to other websites are ignored during discovery, but users can add any page by hand (some companies host their changelog elsewhere).

**Tested on the live site, 3 Oct 2026** (using Riposte itself as the product, and its real competitors):
- Saving the product profile works.
- **visualping.io:** found the blog, pricing page and sitemap. Correctly reported no changelog and no blog feed.
- **crayon.co:** found the blog, the blog feed, the pricing page and the sitemap. Crayon has no public prices, so its `/pricing` address leads to a "pricing inquiry" form; Riposte followed that redirect, which is the right page to watch for when public pricing appears.
- Adding a page by hand works and is labelled "Added by you".

**What broke / fixed:**
- **The "found N pages" message counted pages the user added by hand.** After adding one page manually, the banner said Riposte had found 5 pages instead of 4. Fixed: the message now counts only pages found automatically, and the list heading shows the full picture: total watched, how many were found automatically, and how many were added by hand.
- **The check-frequency dropdown stretched across the whole screen.** A shared style forced full width. Fixed with a compact dropdown.

## Phase 3 · The fetcher

**Goal:** Riposte reads every watched page on a schedule, compares it with the last check, ignores noise, and keeps only what really changed.

**Built:**
- **Daily automatic check** at around 7am India time (Vercel Cron). Daily competitors are checked every day, weekly ones every 7 days.
- **Check now** button on each competitor, with a 5-minute cooldown so a site isn't hit repeatedly.
- **First check right after adding a competitor**, running in the background, so the starting point is saved straight away.
- **Three kinds of reading:**
  - *Web pages* (blog, changelog, pricing, other): main content only.
  - *Blog feeds:* every post with its title, link and date. A change = new posts.
  - *Sitemaps:* every page on the site (content sitemaps first). A change = new pages.
- **Noise filter:** removes menus, footers, cookie and consent banners, popups, newsletter boxes, chat widgets and share buttons; strips "3 hours ago", view counts, "5 min read" and copyright lines; ignores lines that only moved position.
- **Change detection:** compares the lines (or posts, or page addresses) of the new check with the last one, and records what was added and what was removed.
- **Fallback for pages built by JavaScript or blocked:** if a page returns almost no text, Riposte tries a page-reading service (r.jina.ai). A switch in reading method starts a fresh baseline instead of creating a fake change.
- **Respects robots.txt:** pages a site asks bots not to read are skipped and flagged.
- **Status on every page:** "Checked 3 hours ago · last changed 2 days ago", or a plain-language reason when a page couldn't be read.
- **Recent changes** on each competitor page and **Latest changes** on the home screen, shown as Before / Now.
- New tables `snapshots` (last 5 checks per page are kept) and `changes`.

**Tested before deploying** (sample pages): a price change from $9 to $12 was detected; a change in only "3 hours ago" / "2 days ago", view counts and read time was correctly ignored. RSS, Atom, sitemap and sitemap-index parsing and robots.txt rules all worked.

**What broke / fixed:** _to fill in after testing._
