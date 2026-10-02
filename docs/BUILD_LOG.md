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
