# How to write a blog post

1. Copy one of the `.md` files in this folder and rename it. The file name becomes the address: `my-new-post.md` → `/blog/my-new-post`.
2. Fill in the settings at the top, between the `---` lines:

| Setting | What it is | Rule of thumb |
| --- | --- | --- |
| `title` | The big heading on the page | Plain and specific |
| `metaTitle` | The title Google shows | Under 60 characters, keyword first |
| `description` | The meta description | Under 160 characters |
| `summary` | The "Quick answer" box at the top | 2–4 sentences that answer the question on their own, so AI tools can quote it |
| `date` / `updated` | Published and last updated | `YYYY-MM-DD`; change `updated` whenever you edit |
| `keywords` | Main keyword first | 3–5 |
| `tags` | Shown on the page | 1–3 |
| `faqs` | Questions and answers at the bottom | 3–5; each answer 1–3 sentences |

3. Write the post below the second `---` in Markdown: `## Heading`, `- bullet`, `**bold**`, `[link](/blog/other-post)`.
4. Commit and push. Vercel publishes it, and it is added to the sitemap, the blog page and `llms.txt` automatically.

The page adds the SEO and AEO pieces for you: meta title and description, canonical link, social share tags, article and FAQ schema, author schema, and a table of contents from your `##` headings.
