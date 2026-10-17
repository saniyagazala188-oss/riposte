# How to add or edit an author

Each author is one file in this folder. The file name is their page address:
`saniya-gazala.md` → `useriposte.com/authors/saniya-gazala`.

To add someone, copy `saniya-gazala.md`, rename it (for example `jane-doe.md`), and change the details.
To put a post under their name, add `author: "jane-doe"` to the post's settings. Posts without `author` go to Saniya.

## The settings at the top

| Setting | What it is |
| --- | --- |
| `name` | Full name |
| `role` | One line under the name, e.g. "Product marketer" |
| `headline` | One or two sentences about them, shown big at the top and on every post they wrote |
| `image` | Their photo: put it in `public/authors/` and write `/authors/jane-doe.jpg`. Leave it `""` to show initials |
| `location` | City, country |
| `links` | Any profiles: LinkedIn, Medium, GitHub, a website. Each has a `label` and a `url` |
| `highlights` | Up to 4 big numbers, each with a `value` ("6+") and a `label` |
| `experience` | Jobs, newest first: `role`, `company`, `dates`, and optional `summary` and `points` |
| `education` | `title`, `place`, `dates` |
| `learning` | Courses and certifications: `title`, `place`, and `status` ("Completed, Oct 2026") or `dates`. Add `url` to link a certificate |
| `skills` | A list of short skills |
| `sections` | Anything else you want: talks, projects, awards, articles. Each has a `title` and `items` (`title`, optional `text`, `meta` and `url`) |

Every setting is optional. Leave one out and that part of the page simply doesn't show.

Example of an extra section:

```yaml
sections:
  - title: "Writing elsewhere"
    items:
      - title: "My Medium article"
        meta: "Medium · 2026"
        text: "One line about it."
        url: "https://medium.com/..."
```

## The story under the settings

Below the second `---`, write about them in plain Markdown. Use `## About me`, `## My learning journey`, or any headings you like. A bullet list becomes a timeline.
