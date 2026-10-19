# How to write a docs page

Docs live at `/docs`. They explain how to set up and use one Riposte feature each. Blog posts (`content/blog`) are for articles; docs are for "how do I…".

1. Copy a `.md` file here and rename it. The file name becomes the address: `slack-alerts.md` → `/docs/slack-alerts`.
2. Fill in the settings between the `---` lines:

| Setting | What it is |
| --- | --- |
| `title` | The page heading, starting with a verb: "Get competitor alerts in Slack" |
| `metaTitle` | The title Google shows, under 60 characters |
| `description` | Under 160 characters |
| `summary` | The "In short" box: the whole answer in 2–3 sentences |
| `category` | One id from `categories.json` |
| `order` | Position inside the category (1, 2, 3…) |
| `updated` | `YYYY-MM-DD`. Change it whenever you edit, so search engines are told (IndexNow) |
| `appLink` | Optional button to the feature: `{ href: "/app/settings", label: "Open Settings" }` |
| `faqs` | Up to 10, buyer or user questions, direct answer first. All go into the FAQ schema |
| `related` | Other docs to suggest at the end: `["email-alerts"]` |

3. Write short. One action per step, one picture per step if it helps. Section headings (`##`) are not numbered in docs; write "Step 1: …" yourself when it's a sequence.
4. Pictures go in `public/docs/<topic>/`. Use simple product-style drawings that show the one action, not full screenshots, and no real competitor data.
5. Boxes work the same as the blog: `:::tip`, `:::note`, `:::important`, `:::example`, closed with `:::`.
