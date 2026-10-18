# How to write a blog post

1. Copy one of the `.md` files in this folder and rename it. The file name becomes the address: `my-new-post.md` → `/blog/my-new-post`.
2. Fill in the settings at the top, between the `---` lines:

| Setting | What it is | Rule of thumb |
| --- | --- | --- |
| `title` | The big heading on the page | Plain and specific |
| `metaTitle` | The title Google shows | Under 60 characters, keyword first |
| `description` | The meta description, also shown under the title | Under 160 characters |
| `summary` | The "Quick answer" box at the top | 2–4 sentences that answer the question on their own, so AI tools can quote it |
| `date` / `updated` | Published and last updated | `YYYY-MM-DD`; change `updated` whenever you edit |
| `keywords` | Main keyword first | 3–5 |
| `tags` | Topic chips; the first one is the category | 1–3 |
| `faqs` | Questions and answers near the end. All of them go into the FAQ schema automatically | Up to 10. Ask what a buyer would type ("best tool for…", "how much does…", "how often should I…"). Start each answer with the direct answer, 1–2 sentences, so AI tools can quote it on its own |
| `cover` | Big image at the top, on cards and in LinkedIn previews | `/blog/covers/my-post.jpg`, 1200 × 630 |
| `coverAlt` | What the cover shows, in words | One short line |
| `verdict` | "The bottom line" card at the end | 1–2 sentences, the one thing to remember |
| `cta` | The image CTA at the end of the post | A name from `content/ctas.json`. Leave it out for `beta`, write `none` for no CTA |
| `related` | Posts to show first under "Keep reading" | `["post-one", "post-two"]`; the rest are picked by matching tags |

3. Write the post below the second `---` in Markdown: `## Heading`, `- bullet`, `**bold**`, `[link](/blog/other-post)`.
   - Every `##` heading gets a number and goes in the "On this page" list. If you write `## 3. Something`, it keeps your number.
4. Commit and push. Vercel publishes it, and it is added to the sitemap, the blog page and `llms.txt` automatically.

## Images

- Put images in `public/blog/` (any folder inside it), then write:
  `![What the image shows](/blog/my-image.jpg "Caption under the image")`
- App screenshots go in `public/blog/screens/`. They get a browser frame automatically, with the right address: `actions.jpg` shows `useriposte.com/app/actions`.

## Special boxes

Write these on their own lines, with an empty line before and after.

**Image CTA** (a card with image, heading and button):

```
:::cta beta
```

**Read next** (a card linking to another post, by its file name):

```
:::read how-to-track-competitors
```

**Highlighted boxes** (`tip`, `note`, `important` or `example`; the title is optional). Close with `:::`:

```
:::tip Where to find them
Most sites link these in the footer.
:::
```

## Image CTAs: content/ctas.json

All CTAs live in one file, `content/ctas.json`. Change a CTA there and it changes in every post that uses it.

```json
"beta": {
  "eyebrow": "Free, invite-only beta",
  "title": "The main heading",
  "subtitle": "The line under it",
  "button": "Button text",
  "link": "/#waitlist",
  "image": "/blog/ctas/beta.jpg",
  "imageAlt": "What the image shows"
}
```

- `beta` is the name you use in `:::cta beta` or `cta: "beta"`.
- To add a new CTA, copy one block, give it a new name, and keep the commas between blocks.
- Images go in `public/blog/ctas/`. A 4:3 image works best (for example 800 × 600).
- `eyebrow`, `subtitle` and `image` are optional.

The page adds the SEO and AEO pieces for you: meta title and description, canonical link, social share image, article and FAQ schema, author schema, and the table of contents.
