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

**Still rough:** the login email is Supabase's generic message. Branding it is blocked until Riposte has its own domain; see phase 4.

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

**Setup:** two new private settings in Vercel: `SUPABASE_SERVICE_ROLE_KEY` (lets the daily check run with nobody logged in) and `CRON_SECRET` (so only Vercel can start it), both stored as Secret.

**Tested on the live site, 3 Oct 2026:** Check now on Crayon read 5 pages. The blog, blog feed, pricing page and the hand-added page were saved as starting points.

**What broke / fixed:**
- **Crayon's sitemap couldn't be read.** It lists every image and video as well as every page, which makes it several megabytes. Riposte stopped reading at 1.5 MB, so the file was cut off part-way and the XML reader rejected it. Fixed in three ways: sitemaps and feeds may now be up to 8 MB with a longer time limit; a file that runs out of time keeps what already arrived; and sitemaps are now read entry by entry, so even a cut-off file gives every complete page address. Image and video addresses inside the sitemap are ignored, since they aren't pages. Re-tested on the live site: the sitemap now reads correctly and is saved as a starting point.
- **The Check now message left out unchanged pages.** After the second check it said "Checked 5 pages. 1 saved as a starting point", without mentioning that the other 4 were unchanged. Fixed: it now also says "4 unchanged since the last check".

**Proof the noise filter works on real pages:** Crayon's blog, blog feed, pricing page and AI toolkit page were each read twice, about 7 minutes apart, and none was reported as changed, even though live pages carry rotating elements and timestamps.

**Still to confirm:** the first automatic morning check (7am India time on 4 Oct), and a real competitor change appearing as Before / Now.

## Phase 4 · AI signals and alerts

**Goal:** every real change arrives explained for your product (what changed, why it matters, what to do), and the important ones reach you by email or Slack without opening the app.

**Built:**
- **AI signal writer (Gemini).** Each detected change is sent to Gemini together with your product profile. It returns a title, what changed (with exact numbers and names from the page), why it matters to *your* product and buyers, one concrete next step, an impact level (high / worth knowing / low) and a category (pricing, product, content, positioning).
- **Noise check.** The AI also flags changes that mean nothing (typos, reshuffled lists, rotating logos). These go to a separate Noise tab instead of the feed, so a second filter sits on top of the phase 3 noise filter.
- **Signal feed** on the home screen with three tabs: To review, All, Noise. Each signal has Mark reviewed and Dismiss, and "See exactly what changed" opens the Before / Now evidence.
- **Changes waiting to be explained** are shown raw with an "Explain them now" button, so nothing is hidden if the AI is busy or not set up.
- **Competitor page** now shows that competitor's signals.
- **When it runs:** after every Check now, and in the daily morning job after the pages are checked.
- **Email alerts** for high-impact signals, one email per morning listing all of them (sent through Resend).
- **Weekly digest** every Monday morning: the week's signals, high impact first. A quiet week gets a short "nothing to do" email.
- **Slack:** paste an incoming webhook to get the same alerts and digest in a channel.
- **Alerts page** to switch email alerts and the digest on or off, add Slack, and send yourself a test email, test Slack message or this week's digest.
- **Branded login email** template, ready to paste into Supabase.

**Decisions:**
- The text copied from a competitor's page is marked as data in the prompt, and the AI is told to ignore any instructions inside it. A competitor page can't steer the AI.
- The AI must quote numbers and names from the evidence and must not invent anything; when the evidence is thin it says so.
- If the AI service is busy (rate limit), Riposte stops and tries the rest on the next run, without counting it as a failure. A change that fails 3 times is left as a raw change in the feed.
- Each alert is sent once. Alerts only cover the last 3 days, so switching email on later doesn't flood the inbox with old changes.
- The digest runs inside the existing daily job on Mondays, so no second scheduled job is needed.
- Gemini and Resend are called directly over HTTPS, so no extra packages. The keys stay on the server.

**Tested before deploying** (sample data): the prompt includes Before / Now lines and the "treat as data" guard; a sitemap with 3,000 new addresses is cut down to fit; invalid AI answers (unknown impact or category, missing title) are corrected or rejected; noise is always low impact; emails escape HTML; the digest puts high impact first and handles a quiet week.

**Setup:** new database migration `0004_phase4_signals.sql`; two new private settings in Vercel, `GEMINI_API_KEY` and `RESEND_API_KEY`, both stored as Secret.

**What broke / fixed / blocked:**
- **Branded login email: blocked until Riposte has its own domain.** The plan was to paste a Riposte-styled template (`supabase/templates/login_email.html`) into Supabase. On the live project, Supabase no longer lets you edit login email templates unless emails go through your own email service (custom SMTP). Resend can be that service, but only from an address on a domain you own. Without one, Resend would deliver login emails to the founder's address only, so any other person (a tester, an interviewer) couldn't log in. That's worse than a plain email.
  - *Now:* login uses Supabase's default "Your sign-in link" email from "Supabase Auth". It works, it just isn't branded.
  - *Fix when unblocked:* buy a domain → verify it in Resend (add the DNS records it gives) → in Supabase, Authentication → Emails → SMTP Settings: host `smtp.resend.com`, port `465`, username `resend`, password = a Resend API key, sender e.g. `login@<domain>` → paste the template into "Magic link or OTP" and "Confirm sign up" → set `EMAIL_FROM` in Vercel to the same domain, so alert and digest emails also come from Riposte. About 10 minutes once the domain exists. This also lifts Supabase's built-in limit on how many login emails it sends per hour.
- **An API key was shared in chat by mistake.** The key was deleted in Google AI Studio straight away and a new one was created and stored only in Vercel as a Secret. Rule kept: keys go into Vercel, never into chat, code or GitHub.
- **After adding the keys, the live app still said both were missing.** Vercel only gives a key to versions built after it was saved. The first redeploy was started on an older version, which Vercel refuses once a newer one exists, so it never ran. And the Gemini key was saved at almost the same moment the newest version was being built, so that version missed it. Fixed by redeploying the newest version once both keys were saved. Rule: after adding or changing a key in Vercel, redeploy the top (newest) deployment.

**Tested on the live site, 3 Oct 2026:**
- Alert settings save correctly.
- The test email arrived at the founder's Gmail from "Riposte <onboarding@resend.dev>", but **in spam**. Gmail distrusts the shared Resend test sender. For now: "Report as not spam" once. Lasting fix: the same own-domain step as the login email (a verified domain lets Gmail trust the sender).
- The weekly digest ("Send this week's digest now") arrived, correctly reporting a quiet week across 2 competitors. Also in spam, same cause.

**Demo page for testing:** real competitors may not change for days, so `/demo/pricing` is a pricing page for a fictional company, Acme Insights, that switches between two versions every 10 minutes (Pro goes from $49 to $59 with AI battlecards added, an Enterprise plan appears, the free trial drops from 14 to 7 days). Watching it and pressing Check now 10 minutes apart produces a real change, which tests the whole chain: change → AI signal → feed → email alert. It is hidden from search engines.
- **First AI signal, end to end.** Acme Insights (demo) was added with its pricing page, checked once (starting point), then checked again after the 10-minute switch. Result: "Checked 1 page. 1 changed. 1 new signal explained." The signal was marked **High impact · Pricing**, titled "Acme drops price to $49/mo and extends free trial to 14 days". It quoted the exact before and after prices and trial terms, noticed the Enterprise plan and the AI battlecards line had gone, explained what this means for Riposte's buyers (easier for cash-conscious teams to trial Acme; possibly a move down-market), and recommended updating the Acme battlecard. The starting point happened to be the $59 version, so the change really was a price drop, and the AI described the direction correctly.
- **High-impact email alert arrived** within seconds of the signal: subject is the signal title, and the body has the impact, competitor, what changed, why it matters and what to do, plus links to the feed and alert settings. Still in spam (shared test sender); a Gmail filter on `onboarding@resend.dev` set to "Never send it to Spam" works around it until the domain is set up.

**Phase 4 status:** working on the live site, from change to AI signal to feed to email alert, plus the weekly digest. Not yet tested: Slack (optional, needs a Slack workspace) and the signal step inside the automatic morning check.
- **Setup checklist stayed on the home screen after setup was finished**, with every step crossed out, pushing the signals down. Fixed: the checklist now hides once all steps are done, so the feed starts with signals.

## Phase 5 · Action kit

**Goal:** go from "what changed" to a finished response in minutes. For each signal, Riposte lists what to create, who owns it, where to share it, and writes the first draft of each.

**Built:**
- **Build action kit** button on every signal (in the feed and on the competitor page). The AI gets the product profile, the signal and the Before / Now evidence, and returns 2–4 actions, most important first.
- **Each action has:** the type of asset (battlecard update, sales talk track, comparison page update, blog post, LinkedIn post, customer email, internal Slack update, website copy), a one-line title, why it's needed now, where to share it (for example "#sales Slack channel" or "Battlecard in the sales wiki"), the owner (PMM, Sales, Content & SEO, Product, Leadership, Customer success), how soon (Today, This week, Later), and a **first draft** ready to edit.
- **Copy draft** and **Mark done** on every action. **Rebuild open actions** asks the AI again and keeps the ones already done.
- **Actions page** (new tab): every open action across all signals, grouped into Today / This week / Later, filterable by owner, with a list of what's done. This is the team's to-do list for competitor responses.

**Decisions:**
- Built on demand, not automatically: drafts are long, so writing them only for signals someone cares about keeps AI use (and cost) low.
- The AI may use only facts from the signal and the evidence. Anything the marketer has to supply (their own price, a customer name, a link) appears as a placeholder in [square brackets], so a draft never contains invented numbers or quotes.
- Public assets (blog, LinkedIn, website) focus on your own strengths and don't need to name the competitor. No unverifiable claims, no mocking. Sales assets can name the competitor.
- Owners are fixed roles for now, not named people; naming people can come with team accounts.

**Tested before deploying** (sample data): the prompt carries the evidence and a clean comparison-page address; unknown asset types, owners and priorities fall back to safe defaults; empty items are dropped; a kit is capped at 4 actions.

**Setup:** one new database migration, `0005_phase5_action_kit.sql`. No new keys.

**What broke / fixed:**
- **"Build action kit" failed on the first live try.** The first error message was too vague ("Couldn't build the kit"), so it was changed to show the real reason. The real reason: Google answered *503, "This model is currently experiencing high demand"*. Gemini's servers were overloaded; nothing was wrong in Riposte. Fixed in the AI client for every AI call: when Google is overloaded, Riposte waits a moment and tries again, then tries once more on a lighter Gemini model (Flash-Lite). In the morning job, an overloaded moment no longer counts as a failed attempt; the change is simply explained on the next run. If it's still busy, the message now says so in plain words.
