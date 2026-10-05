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

**Tested on the live site, 3 Oct 2026:** after the retry fix, "Build action kit" on the Acme price-drop signal returned 3 actions:
1. *Today · Battlecard update · Owner: PMM · Battlecard in the sales wiki.* Accurate bullets: $59 → $49, trial 7 → 14 days with no card, Enterprise tier and its features removed.
2. *Today · Sales talk track · Owner: Sales · #sales Slack.* When to use it, acknowledge the price, pivot to value, one objection ("Acme is cheaper and gives me 14 days") with an answer.
3. *This week · Internal update · Owner: PMM · #product-updates Slack.* A ready-to-paste heads-up that points the team to the updated battlecard.

**Review of the drafts:** every fact matched the evidence, nothing was invented, and owners, channels and urgency were sensible. Weak spot: the "pivot to value" lines are generic ("review what you need for your workflow"), because the AI only knows a one-line pitch about the product and has no list of its real strengths, so it had nothing specific to pivot to.
- **Fix for the generic "pivot to value" lines:** a new field on Your product, **What makes you different** (2–3 short points). Both the signal writer and the action kit now get these points, and the kit is told to build every value pivot (talk tracks, battlecards, posts, comparison pages) on them, applied to the specific move. If the field is empty, the draft gets a [your key differentiator] placeholder instead of filler. Needs migration `0006_differentiators.sql`.
- **Re-tested with differentiators filled in** ("explains every change for your product", "writes the response for you", "tracks AI search citations"). After "Rebuild open actions", the battlecard gained three "How to win" lines built on those points, and the talk track's answer now pivots to them instead of "review what you need for your workflow". Facts stayed accurate. Still to improve later: the talk track lists the strengths almost word for word rather than tying each one to the price move (for example, "a cheaper tool that only alerts you still leaves the work to you").

**Phase 5 status:** working on the live site: build kit → owners, channels, urgency, drafts → copy, mark done → Actions board.

**Improvements after the first live use (4 Oct, from Saniya's feedback):**
- **Finishing a kit closes the signal.** When the last open action of a kit is marked done, the signal is marked reviewed automatically, so it leaves "To review" without a second click. Reopening an action doesn't reopen the signal.
- **"Responses shipped" in the Monday digest.** Each action now records when it was done. The digest starts with "Your team shipped N responses to competitor moves this week", lists them with the competitor's name, and says how many are still open with a link to the Actions board. This gives leadership proof that the team reacts, not only watches. Needs migration `0007_action_done_at.sql`.
- **Many competitors on the Actions board.** Question raised: with several competitors, how do you tell which action belongs to which? Fixed in three ways: every action card now starts with the competitor's name as a badge (linking to that competitor); a **Competitor** filter shows each competitor with its number of open actions; and **Group by** switches between Urgency (Today / This week / Later) and Competitor. Filters combine, for example "Sales actions for Acme". Each card also says which signal it responds to.
- **The Actions filters were hard to read** (Saniya's review): three rows of small pill links (Competitor, Owner, Group by) sat in one cluster with tiny headers, and "See 2 done" was a small link squeezed underneath, easy to miss in a demo. Redesigned:
  - **Open / Done tabs** with counts at the top, so switching between open and finished work is one obvious click.
  - **One filter panel** with two labelled dropdowns, **Competitor** (each showing its open count) and **Owner**, so a long competitor list no longer wraps across the screen.
  - **Group by** as a two-option switch (Urgency | Competitor) on the right of the panel.
  - **Clear filters** appears only when a filter is on.
  The filters still live in the page address, so a filtered view can be bookmarked or shared.

## Phase 6 · Content intelligence, linked signals, intent-change and trend alerts

Phase 6 is split into three parts, built one at a time:
- **6a · Content intelligence:** publishing pace, page mix, topics. *(this part)*
- **6b · Linked signals and trend alerts:** related moves by one competitor joined into one story; a topic flagged when several competitors start writing about it.
- **6c · Intent-change alerts:** when a competitor rewrites an existing page.

### 6a · Content intelligence

**Goal:** replace the weekly Ahrefs-export-and-compare routine. See at a glance how much each competitor publishes, what kind of pages they have, and which topics they're building.

**Built:**
- **Content page** (new tab): one card per competitor with posts in the last 90 days, total pages on their site, number of comparison pages, when they last posted, and their top 3 topics. Busiest publishers first.
- **Their content** section on each competitor page:
  - *Publishing pace:* posts in the last 30 and 90 days, and posts per month for the last 6 months, from the dates in their blog feed.
  - *Latest posts* with dates and links.
  - *What kind of pages they have:* their sitemap sorted into comparison & alternatives pages, blog posts, guides & learning, customer stories, product & features, and release notes, recognised from the page addresses.
  - *Topics they're building:* "Find their topics" sends up to 120 post titles (and blog page addresses turned into readable titles) to the AI, which groups them into 4–8 topics with counts, share, the angle they take, and real example titles, plus a 1–2 sentence summary of their content strategy and what it means for your product.
- No extra fetching: everything comes from the feed and sitemap Riposte already reads each morning.

**Decisions:**
- **Comparison pages are counted first**, before blog posts, because "acme-vs-you" and "alternatives" pages are the ones a PMM must answer.
- **The pace is honest about its limits:** most feeds list only the latest 10–50 posts, so the page says so; competitors without a feed show "–" with the reason instead of a misleading zero.
- **Topics on demand, not every day:** topics change slowly, and on-demand keeps AI use low. The age of the analysis is always shown.
- **AI uses only real titles:** examples must be copied from the list, and the text from the website is marked as data, not instructions.

**Tested before deploying** (sample data): dates in RSS, ISO and plain formats are read and bad dates skipped; posts land in the right month; 30/90-day counts are right; comparison pages win over blog posts ("/blog/acme-vs-x" counts as comparison); page addresses become readable titles; AI topic answers are tidied (counts capped, empty names dropped, examples limited, largest topic first).

**Setup:** migration `0008_phase6_content_topics.sql`. No new keys.

**Tested on the live site, 4 Oct 2026:** the Content page loaded with one card per competitor. **Crayon:** 4 posts in the last 90 days, last post 2 days ago, 627 pages in its sitemap, **34 comparison pages**. Acme (the demo page) correctly shows no feed or sitemap.

**What broke / fixed:**
- **Visualping showed "–" for pages even though Riposte watches its sitemap.** The card said nothing about why, so it looked like missing data. Visualping has no blog feed (correct), but its sitemap is watched; the dash means its sitemap hasn't been read successfully yet. Fixed: the dashes now carry the reason: "No sitemap" (not watched), "Not checked yet", or "Couldn't be read" (with details on the competitor page).

**Decision: checking stays daily plus on demand, not "real time" (4 Oct 2026).** Question raised: what blocks real-time data? Answer: websites don't announce changes, so every monitoring tool works by checking again on a schedule; Vercel's free plan runs the automatic job once a day; checking very often risks being blocked; and competitors change pricing, launches and content over days, not minutes. An hourly option (scheduled for free through GitHub) was offered and **declined**. The current design (daily automatic check, Check now on demand, first check on adding a competitor) stays as it is. Demo line: "Riposte monitors competitors daily and on demand."
- **"Find their topics" on Crayon (live):** 120 titles grouped into 6 topics: Competitive intelligence programs (28 titles, 23%), Product marketing and launches (22), Sales battlecards and enablement (17), Customer success and case studies (13), AI and product integrations (10), Competitor analysis and research (9), each with its angle and real example titles copied from Crayon's blog, plus a strategy summary. All example titles were real.
  - *Gap noticed:* the topic shares add up to 82%, because 21 titles didn't fit a main topic, and the page didn't say so. Fixed: a line under the topics now says how many titles didn't fit.
  - *Still weak:* the "what it means for you" part of the summary is generic ("a clear blueprint for using competitive insights"). Crayon sells in the same space as Riposte, so this should point at overlap and gaps. To sharpen with the trend and gap work in 6b.

**Phase 6a status:** working on the live site (pace, page mix, comparison-page count, AI topics).

## 4 Oct 2026 · Checking the first automatic morning run

- **Crayon's pages still said "Checked 1 day ago" in the evening**, so the 7am run seemed to have skipped them. Cause: the morning job only re-checked a daily page if its last check was at least 20 hours old. Crayon had been checked by hand at about 9pm the night before, only 10 hours earlier, so it was skipped, and would only have been checked the following morning, about 34 hours after the manual check. Fixed: a daily page is now due unless it was checked in the last 12 hours. Since the job runs once a day, every daily page is checked every morning unless someone pressed Check now overnight.
- **Check now on Crayon, about 26 hours after the last check:** "Checked 5 pages. 5 unchanged since the last check." No false changes across a full day on 5 real pages (blog, feed, pricing, 8 MB sitemap, AI toolkit page), which is stronger proof of the noise filter than the 7-minute test. The automatic morning job itself is still to be confirmed at 7am on 5 Oct, with the 12-hour rule.

### 6b · Linked signals and trend alerts

**Goal:** see a competitor's coordinated campaign as one story instead of three separate alerts, and spot a topic early when several competitors start publishing about it.

**Built:**
- **Connected moves (linked signals):** the AI reads a competitor's signals from the last 30 days and joins the ones that belong to the same move (for example a price rise + a launch post + a changelog entry about one new feature) into a story: a title, what they're doing, why it matters to you, one next step, and links to each connected signal. Shown at the top of the feed and on the competitor page, with Mark reviewed and Dismiss.
- **When it runs:** after Check now finds new signals, in the morning job for every competitor with new signals, and on the **Find connected moves** button.
- **Trend alerts:** the AI compares what each competitor published in the last 45 days (dated feed posts and newly found pages) and flags topics that **two or more competitors** cover: the topic, what they're saying, why it matters, a content step to take, and the real titles from each competitor. Shown at the top of the Content page; refreshed every Monday before the digest, or with **Find trends**.
- **Demo upgrade:** the fictional Acme now has a blog feed (`/demo/feed.xml`) and a changelog (`/demo/changelog`) that switch together with its pricing page. In the "after" version, Pro rises to $59 with AI battlecards, two launch posts appear, and two changelog entries ship: one coordinated move that Riposte should join into a single story.

**Decisions:**
- **No forced connections:** a story needs at least 2 signals and the AI may return none; a trend needs at least 2 competitors, each with real titles copied from its own list, or it is dropped.
- **Reviewed or dismissed stories stay:** a new run replaces only stories still marked new.
- **The morning job stays inside its time limit:** linking and trends stop early if time runs short and continue the next day.

**Tested before deploying** (sample data): stories keep only valid, distinct signal numbers and need at least 2; trends drop titles that aren't in the competitor's own list, match names regardless of case, and are dropped when fewer than 2 competitors remain.

**Setup:** migration `0009_phase6b_stories_trends.sql`. No new keys.

**Tested on the live site, 5 Oct 2026 (just after midnight):** Acme's blog feed and changelog were added and saved as starting points in the "before" version. Check now in the "after" version said: **"Checked 3 pages. 3 changed. 3 new signals explained. 1 connected move found."**
- 3 new high-impact signals: the price rise to $59 with AI battlecards and an Enterprise tier (pricing page), the launch posts for AI battlecards and Acme Enterprise (blog feed), and the AI battlecards and SSO entries (changelog).
- **Connected move:** "Acme shifts pricing and product tiers around AI battlecards and enterprise features", linking **4 signals**: today's three plus the earlier price-drop signal, which the AI correctly saw as part of the same packaging story. Each linked signal is listed and clickable.
- Content section updated by itself: 2 posts in the last 30 days, last post 10 hours ago.
- *Weak spot:* the story's next step ("Monitor Acme's pricing stability over the next month") is passive compared with the signal-level actions. To tighten in the story prompt: the step should be something the team creates or changes.
- **Find trends (live):** "No shared topics yet across the 2 competitors publishing recently." That's an honest result: in the last 45 days Crayon wrote about its Insights API and competitive enablement, while Acme wrote about AI battlecards and Enterprise, with no real overlap, and the AI didn't invent one. Small fix: this "nothing found" message showed in red like an error; it now shows as a normal result.
- **Visualping's sitemap now reads correctly:** 211 pages, 14 comparison pages (it showed "–" on 4 Oct before its sitemap had been checked).

**Klue added as a third real competitor (5 Oct):**
- **Bug: Klue's "Pricing page" was its homepage.** Klue has no public pricing page; when Riposte tried `klue.com/pricing`, the site redirected to the homepage, and Riposte accepted the homepage as "pricing". Fixed: an address that lands on the homepage is never accepted as a pricing, blog or changelog page.
- **Weak pick: "Blog or guides" was `klue.com/news` (press releases)** while Klue's real content lives at `klue.com/articles`. Fixed: when several blog-like sections exist, Riposte now prefers blog > articles > resources > insights > guides > learn > news.
- **No blog feed:** Klue doesn't publish an RSS feed, so its publishing pace can't be counted from dates. New Klue articles still show up through its sitemap (as new pages) from the next daily check, and they feed trend alerts over time.
- **Insight from Klue's footer (Saniya):** Klue runs a `/topics/` section of question-style pages ("How does AI automate win-loss analysis?", "Can ChatGPT or Claude build a battlecard from your Salesforce and Gong data?") and an `/llm-info` page titled "Hey AI, learn about us": pages built to be read and cited by AI search. Riposte didn't recognise these. Added a page type, **Answer pages for AI search** (`/topics`, `/questions`, `/answers`, `/faq`, `/llm-info`, `llms.txt`), so the Content page shows how much a competitor invests in AEO. These titles also feed topic analysis.
- **Klue's answer pages were mostly missing from the count** (1 found, though its footer links several `/topics/` pages). Klue's sitemap is split into many files and Riposte read only the first 3 content files. Fixed: it now reads up to 6, putting blog, article, topic, FAQ and comparison files first (still capped at 3,000 pages per competitor). The count updates at the next check.
- Klue setup after cleanup: `/articles` (blog), `/news` (re-added by hand as release notes / announcements), sitemap, and `/llm-info` added as an "Other page", so changes to how Klue describes itself to AI engines show up as signals.
- **Find their topics on Klue (live):** 6 topics from 120 titles: competitive intelligence program strategy (21%), win-loss analysis and buyer feedback, company milestones and Compete Week, sales battlecards and deal enablement, competitive positioning and differentiation, AI agents and platform integrations. Since "What makes you different" was added, the summary now points at a real gap: Klue serves enterprise competitive enablement and win-loss, which leaves room for Riposte with product marketers and content leads who need alerts on competitor changes. *Watch:* it called Riposte's alerts "real-time", but Riposte checks daily. The topic prompt should only use claims from the product profile.
- Examples come from sitemap page names (lower-case, from the address) because Klue has no feed; Crayon's come from real post titles.

**Phase 6b status:** connected moves and trend alerts work on the live site. Trends need more competitor publishing data, which builds up from the daily checks.
- **Trends couldn't use Klue yet:** trends only read dated posts from the last 45 days, and Klue has no blog feed, so it added nothing until new pages appear in its sitemap. Fixed: for a competitor with fewer than 5 recent dated posts, trends also use the example titles from its topic analysis ("Find their topics"). Competitors without a feed now count from day one.
- **Find trends after the fix (live):** "Found 2 trends across 3 competitors."
  1. **AI competitive agents and battlecards** (Crayon, Klue, Acme): Crayon's Glean integration and Field Agent for Slack, Klue's Compete Agent and AI-generated strengths and weaknesses, Acme's AI-written battlecards. Why it matters: the market wants AI automation, so Riposte should stress that it explains changes and writes the response. To do: publish a post contrasting AI alert generation with actionable response drafting.
  2. **Sales battlecard best practices** (Crayon, Klue): "8 best practices for effective sales battlecards", "Battlecard rollout plan" vs Klue's "battlecard framework", "nine tips for building your first sales battlecard". To do: a guide on cutting battlecard creation time in half with auto-drafted first versions and owners.
  - All quoted titles are real. *Small slip:* trend 1's summary says "both Crayon and Klue" while it lists 3 competitors; the summary should name all of them.

**Phase 6b status: done.** Connected moves and trend alerts both work on the live site with real competitors.

### 6c · Intent-change alerts (rewritten pages)

**Goal:** the old routine compared weekly Ahrefs exports and assumed a URL that "appeared again" had been optimized, without checking what changed. Riposte now spots when a competitor rewrites an existing page and shows exactly how: the title, description and headings, Before / Now, plus whether the page's search intent changed.

**Built:**
- **Page dates from sitemaps:** Riposte now reads each page's "last changed" date from the sitemap and keeps it with the daily snapshot.
- **Rewrite detection:** when a blog post, guide, comparison page or answer page gets a new date, Riposte reads its outline (title, meta description, H1–H3) and compares it with the outline saved before. Up to 5 per competitor per check.
- **Baseline outlines:** the first time Riposte sees a sitemap's dates, it saves the outlines of the 10 most recently changed content pages, so their next rewrite can be compared.
- **AI explanation:** the signal says what changed and whether the intent or angle shifted (for example an informational how-to turned into a commercial "best tools" comparison, or a new target keyword in the title), and what that means for your own content on the topic. Shown as **Page rewritten** in the feed.
- **Sitemap regeneration guard:** if most of a sitemap's dates move at once (many sites stamp every page with today's date on each deploy), nothing is reported.
- **Demo:** Acme now has blog articles and a sitemap with dates. In the "after" version its "10-point checklist for your first competitive intel program" becomes "The 10 best competitive intelligence tools in 2026, compared": an informational guide turned into a commercial comparison.

**Also tightened from the 6b review:** connected-move actions must be something the team creates or changes (not "monitor"); trend summaries must name every competitor in the trend; topic and trend summaries may describe your product only with claims from your profile (no "real-time").

**Tested before deploying** (sample data): lastmod is read per page and image entries are ignored; outlines keep title, description and headings and drop "3 hours ago"; a single moved date is reported, while 100 pages moving at once is treated as regeneration and ignored; non-content pages (pricing) are skipped.

**Setup:** migration `0010_phase6c_rewrites.sql`.

**Tested live (5 Oct):**
- Ran migration 0010, opened the Acme demo before and after its switch, then pressed **Check now**. Four changes came in at once; the explain budget ran out before the rewrite, so it waited under "changes waiting". **Explain them now** handled it.
- **Signal:** "Acme Insights pivots blog post into a comparison list" · High impact · Content · **Page rewritten**. It says the article changed from an informational checklist into a commercial "best tools" comparison, so Acme is going after high-intent comparison searches. The Before / Now outline shows the old title, description and steps struck through, and the new title "The 10 best competitive intelligence tools in 2026, compared" with H2s for Acme, Crayon and Klue and "Pricing compared".
- **What to do:** "Write a comparison post evaluating the top competitive intelligence tools with a focus on AI search tracking and automated response drafting." This uses Riposte's own differentiators.
- **No false alarms:** Crayon was rechecked 26 hours later. Five pages had unchanged dates, and none were reported.

**Phase 6c status: done.**

**Also added for the video:** a way to clear old test data so the feed looks clean on camera. **Clear history** on a competitor's page deletes that competitor's signals, action items and connected moves. **Start fresh** on the Alerts page deletes all of them, plus trends. Competitors, pages and snapshots are kept, so the next check compares against today and doesn't re-report old changes. Both ask for a second click before deleting.

## Phase 7 · Prompt Studio (AEO prompts)

**Goal:** turn SEO keywords into the buyer prompts people type into AI assistants. This follows Saniya's AEO rules: every prompt asks for a buying recommendation (never "how does X work" or "what's the difference"), no brand names, and prompts are grouped into **Shield topics** (broad category coverage) and **Spear topics** (niches to win, each one product + situation). Within each topic, prompts vary across persona, use case, constraint, comparison, authority and specificity.

**Built:**
- **Prompts** page: keywords plus optional "Areas to win". Each area becomes a Spear topic. It uses the product profile (category, buyers, what makes you different) and the topics competitors publish about as context.
- **Rule checks after the AI writes** (the AI isn't trusted to follow the rules on its own). Riposte removes prompts that:
  - name a brand: your product, any competitor's name or domain;
  - read as informational ("what's the difference", "how does", "pros and cons", "what should I look for", "explain", "why…");
  - are outside 10–40 words;
  - repeat another prompt.
  The result says how many were removed and why.
- **Angle coverage chips** on each topic show which of the six angles it covers and which it misses.
- **Track** up to 10 prompts for AI visibility (Phase 8). Tracked prompts and your own are kept when prompts are rewritten.
- **Add your own prompt**, checked against the same rules with a plain explanation when it breaks one.
- **Download CSV (Profound-ready):** `topic,prompt` with a `# --- SHIELD TOPIC: … ---` comment row before each topic, the format from the AEO rules.

**Tested before deploying** (sample prompts):
- "Is Crayon or Klue better for…" → removed (brand).
- "What's the difference between…" and "How does competitor monitoring software work…" → removed (informational).
- "Best CI tool?" → removed (too short).
- A repeated prompt → removed.
- Three buyer prompts kept, and the CSV matched the expected format.
- Brand list for this account: riposte, crayon, klue, acme insights, acme, visualping. Common first words like "product" or "insights" are never treated as brands.

**Setup:** migration `0011_phase7_8_prompts_visibility.sql` (covers phases 7 and 8).

## Phase 8 · AI visibility

**Goal:** see who AI search recommends for your buyer prompts, and why. This uses the official Gemini API with **Grounding with Google Search**; nothing is scraped. ChatGPT and Perplexity have no comparable free official option, so the engine is named on the page.

**Built:**
- **AI visibility** page:
  - **Ask N prompts now / Run again now** sends each tracked prompt to Gemini with Google Search on, phrased exactly as a buyer would ask it.
  - The daily job re-asks each prompt once a week.
  - A prompt asked in the last 30 minutes is skipped, so a double click doesn't spend searches twice.
- For each answer, Riposte records:
  - which products it names and in what order: you, your competitors, and other brands it recommends that you don't track (found by a small second AI call);
  - the **searches the AI ran** (query fan-out);
  - the **sites it used** as sources.
- **Share of AI answers:** how many answers name each product, its average position, and the change since the previous run. Untracked brands that AI keeps naming show up too, so they can be added as competitors.
- **Sites AI relies on:** the most-cited domains, with competitor domains flagged. Getting listed on those sites is how you get named.
- **Where competitors are named and you aren't:** the gap list, with who was named and the top sources, so each gap becomes a page to create or a site to get listed on.
- **Every prompt:** the full answer, its searches and sources, plus Google's search-suggestions box, which Google's terms require next to grounded answers.

**Cost check:** Google gives 5,000 free search queries a month for Grounding with Google Search on Gemini 3 Flash models (shared). 10 prompts a week at about 3–4 searches each is roughly 150 a month.

**Tested before deploying** (sample answer):
- Klue #1, Crayon #2 (also found by its domain), Kompyte and Visualping found as untracked brands.
- G2 was named only as a source, so it isn't counted as a product.
- Duplicate sources are merged.
- Shares and average positions add up correctly.

## Phase 9 · Living comparisons and launch polish

**Goal:** comparison pages ("You vs Competitor") are among the most-cited pages in AI answers, but they go stale as soon as a competitor changes pricing. Riposte writes a fair comparison from facts it already holds, and flags it the moment it's out of date.

**Built:**
- **Comparisons** page, with one tab per competitor, each marked *not written*, *✓ up to date* or *out of date*.
- **Write the page** builds the draft from:
  - your product profile;
  - the competitor's latest pricing page snapshot and release notes;
  - the changes Riposte detected;
  - the topics they publish about;
  - your Prompt Studio prompts, so the FAQ answers what buyers ask AI.

  The draft has a title, meta description, intro with a "last updated" date, a criteria table (pricing first), "Choose us if" / "Choose them if", a verdict and an FAQ.
- **Honesty rules:** prices and plan names are quoted exactly from their site. Anything about them that isn't in the evidence says "Not published". Anything about you that isn't in the profile becomes a [placeholder]. The page must say where the competitor is stronger. No superlatives.
- **Out of date:** when the competitor gets a pricing, product or positioning signal after the page was written, Riposte shows an alert on the page and a banner on the Feed, listing what changed. **Update the page** rewrites it, and the table highlights the rows that changed since the previous version ("Updated").
- **Copy as Markdown** for the CMS.
- **Landing page:** the feature list now matches what was built: AI visibility runs on Gemini with Google Search (not ChatGPT/Perplexity), and Living comparisons and Prompt Studio are listed separately.

**Tested before deploying** (sample data):
- Rows with no criterion are dropped.
- Changing Acme's Pro price from $49 to $59 marks only the Pricing row as updated.
- In the Markdown export, a "|" inside a cell is escaped.

**Demo flow:** write the Acme page while the demo shows $49. After the switch, Check now gives a pricing signal, and the page is flagged out of date. Update the page, and the Pricing row shows $59 with "Updated".

**Setup:** migration `0012_phase9_comparisons.sql`.

**Phase 8 live test (5 Oct):**
- Prompt Studio wrote the prompts, and Saniya tracked 5 of them.
- **First run: "Asked 0 of 5. Google's AI got busy."** The message hid the real reason. Fixed: failures now end with "Google said: …" and Google's own error.
- **Second run showed the real reason:** "limit reached (You exceeded your current quota, please check your plan and billing details)" on both Gemini Flash and Flash-Lite. Ordinary Gemini calls (signals, prompts) still worked, so the problem is specific to search: this free Gemini key has no quota for Grounding with Google Search.
- **Fix:** when search quota is missing, Riposte asks the same prompt without web search and labels it clearly ("no web search" on each answer, and a note explaining why at the top). These answers still show which products the model already recommends, but they have no sources or searches.
- **Lasting fix:** turn on billing for the Gemini key in Google AI Studio. Grounding includes 5,000 free searches a month, and Riposte's weekly run of 10 prompts uses about 150. Set a budget alert at the same time.
- **Third run, with a new free key (5 Oct, 17:21): "gemini-flash-latest: overloaded (503)".** Search quota was missing again, so Riposte switched to the no-search answer, but it tried only the main model once, and Google was overloaded right then. Fixed: the no-search answer now also retries and falls back to Flash-Lite. Once one prompt shows the key has no search quota, the rest of the run skips search straight away, so the run is faster and uses fewer requests. Prompts are now asked 2 at a time instead of 3, to put less pressure on Google.

## UI redesign (5 Oct, from Saniya's review)

**Feedback:**
- The header was cluttered and wrapped onto two lines.
- Every page was one long scroll.
- Signals, connected moves and waiting changes were mixed together.
- "See exactly what changed" was a tiny link that's easy to miss.
- The competitor, comparison and prompt lists wouldn't hold up at 50–100 items.
- Alerts needed a two-column layout.
- Every login needed an email link, even right after logging out.

**What changed:**
- **Sidebar navigation**, grouped into Monitor (Feed, Actions, Competitors), Content (Content intel, Comparisons), AI search (Prompt Studio, AI visibility) and Settings. The Feed and Actions entries show how many items are waiting. On a phone, a Menu button opens the same list.
- **Feed**, three tabs:
  - **Signals:** a compact list on the left and the selected signal on the right, with its own tabs: *Why it matters · What changed · Action kit*. "What changed" is now a full tab with "Open their page ↗". You can filter by competitor, and the list shows 20 per page. The feed went from about 7,600px tall to one screen.
  - **Connected moves** and **Waiting to be explained** are separate tabs.
- **Action drafts:** "Show draft" is now a real button next to Copy and Mark done, everywhere.
- **Actions** is a board with **Today → This week → Later → Done** columns. Each column scrolls on its own, and you can filter by competitor and owner.
- **Competitors** is a table with search, "N new" to review, pages watched, unreadable pages, last checked and frequency, 10 per page.
- **Competitor page** uses tabs: Signals (the same list + detail view) · Connected moves · Pages watched (with "Add a page" alongside) · Their content · Settings (frequency, clear history, remove).
- **Content intel:**
  - An **"At a glance" table on top**: posts in 30 and 90 days, last post, pages, comparison pages, AI answer pages and top topic for every competitor, 10 per page.
  - **Trends** and **Recently published** (the newest posts across all competitors) sit side by side underneath.
  - The per-competitor report uses two columns.
- **Comparisons:** a searchable competitor list on the left, filterable by out of date, up to date or not written, with the page on the right. It works for 50+ competitors.
- **Prompt Studio:**
  - "Write prompts" and "Add your own prompt" are both at the top, with a counter for prompts, topics and how many are tracked.
  - **Shield** and **Spear** topics sit side by side. Each topic shows its first 4 prompts, with "Show all".
  - Search, and a "Tracked" filter.
  - The tracked limit went from 10 to 30.
- **AI visibility:**
  - Share of answers lists only products that were named; the rest are summed up in one line.
  - The prompt list has filters (All · Competitors named, not you · You're named · Not asked yet), a topic dropdown and 10 per page.
  - "Read the answer" is a button.
- **Your product:** the form sits next to a completeness bar and "Where Riposte uses this".
- **Alerts & account:** two columns. Alerts on the left; Try it, Account and Start fresh on the right.
- **Login:**
  - Log in with **email + password**.
  - **Sign up** asks for one confirmation email, then works with the password.
  - **"Email me a link"** is still there for a forgotten password.
  - Signed-in visitors skip the login page and go straight to the dashboard, and the landing page shows "Open dashboard →".
  - Existing accounts set a password under **Alerts & account → Account**.
  - "Continue with Google" is built in and switches on with `NEXT_PUBLIC_GOOGLE_LOGIN=on`, once Google is enabled in Supabase.

**How it was checked:** a local preview with sample data (24 competitors, 12 signals, 19 actions, 60 prompts; `RIPOSTE_MOCK=1`, development only) was screenshotted page by page on desktop and phone sizes.
