# Riposte

Competitive intelligence for marketers. Riposte tracks competitors' launches, content and pricing, explains what changed and what to do about it, and shows who wins the answers in AI search.

Founded by Saniya Gazala with ❤️ · Built with Claude 🤝 Built in public. Live at https://riposte-eta.vercel.app

## Status

| Phase | What it adds | Status |
| --- | --- | --- |
| 1 | Login, database, landing page with waitlist, live deploy | Done |
| 2 | Product profile, competitors added by domain, page auto-discovery | Done |
| 3 | The fetcher: page reading, main-content comparison, noise filter | Done (morning check to confirm) |
| 4 | AI signals with before/after view, Slack and email alerts, weekly digest | Done (Slack and morning run to confirm) |
| 5 | Action kit: what to create, where it goes, who owns it, with first drafts | Built, testing |
| 6 | Content intelligence, linked signals, intent-change and trend alerts | Planned |
| 7 | Prompt Studio (AEO prompts) | Planned |
| 8 | AI visibility tracking | Planned |
| 9 | Living comparisons and launch | Planned |

What broke and what was fixed at each phase is recorded in [docs/BUILD_LOG.md](docs/BUILD_LOG.md).

## Tech

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) for the database and login (magic link)
- Hosted on [Vercel](https://vercel.com)

## Run it locally

1. Install [Node.js](https://nodejs.org) 20 or later.
2. Install the packages:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key (Supabase → Project Settings → API).
4. Set up the database: in Supabase, open **SQL Editor** and run each file in `supabase/migrations/` in order (0001, 0002, …).
5. Start the app:
   ```bash
   npm run dev
   ```
   Then open http://localhost:3000.

## Project layout

```
src/app/page.tsx              Landing page with waitlist
src/app/login/                Magic-link login
src/app/auth/                 Login callback and sign-out
src/app/app/                  The signed-in app: feed, competitors, product, alerts
src/app/api/cron/check/       Daily job: check pages, explain changes, send alerts and the Monday digest
src/lib/supabase/             Supabase clients for browser and server
src/lib/discovery/            Finds a competitor's pages from its domain
src/lib/fetcher/              Reads pages, filters noise, records changes
src/lib/signals/              Turns changes into AI signals (Gemini)
src/lib/notify/               Email (Resend), Slack, weekly digest
src/middleware.ts             Keeps sessions fresh, protects /app
supabase/migrations/          Database setup, one file per phase
supabase/templates/           Branded login email for Supabase
docs/BUILD_LOG.md             What broke and what was fixed, phase by phase
```
