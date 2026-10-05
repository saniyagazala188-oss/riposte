---
title: "Why I built Riposte"
metaTitle: "Why I Built Riposte, a Competitive Intel Tool for Marketers"
description: "As a product marketer, competitor research ate my Mondays. Here is the problem I lived with, and how I built Riposte to watch, explain and respond for me."
summary: "Riposte is a competitive intelligence tool for marketers. It checks competitors' pricing, release notes, blogs and sitemaps every morning, explains each real change against your own product, and drafts the response: what to create, who owns it and where to share it. I built it because tracking competitors by hand took two to three hours every Monday and still missed what mattered."
date: "2026-10-05"
updated: "2026-10-05"
keywords: ["Riposte", "competitive intelligence tool for marketers", "marketing engineering", "competitor tracking tool"]
tags: ["Building Riposte", "Marketing engineering"]
faqs:
  - q: "What is Riposte?"
    a: "Riposte is a competitive intelligence tool for marketers. It watches competitors every day, explains each change for your product, and drafts your response, such as a battlecard update, a sales talk track or a comparison page."
  - q: "Who is Riposte for?"
    a: "Product marketers, content leads and SEO teams at B2B companies who need to respond to competitor moves, not just know about them."
  - q: "How is Riposte different from other competitor tracking tools?"
    a: "Most tools stop at telling you a page changed. Riposte explains what the change means for your product, writes the first draft of your response with an owner, and also shows what competitors publish and who AI tools recommend."
  - q: "How was Riposte built?"
    a: "With Next.js on Vercel, Supabase for the database and login, a daily scheduled job that reads competitor pages, and Gemini to explain changes. I built it with Claude as my coding partner."
---

Every Monday in my last product marketing role, I spent two to three hours on competitor research. On Wednesday or Friday, I did a quick update so the team knew what had changed and what the plan was.

The research itself was manual. I exported each competitor's recent pages from an SEO tool, compared them with last week's sheet, and pasted what was new. If a page showed up again, we assumed they had optimized it, but nobody checked what changed.

## The problem was four things

- **It was repetitive.** Export, compare, paste, every week, for every competitor.
- **It was inconsistent.** Which competitors got checked depended on how busy the week was.
- **It was reactive.** I found search intent changes and trending topics late, as interruptions that pushed other work back.
- **It took me away from the real job:** understanding buyers, positioning, launches, enabling sales and making sure we showed up in Google and AI answers.

The worst part was the last step. Even when I spotted a change, nothing told me what to do about it. That gap between knowing and responding is where most competitive intelligence dies.

## What I built

Riposte runs a simple cycle every morning:

1. **Capture:** read each competitor's pricing page, release notes, blog feed and sitemap.
2. **Compare:** check each page against the last version.
3. **Filter:** drop noise like dates, banners and menus.
4. **Explain:** say what changed and why it matters for my product and buyers.
5. **Act:** suggest what to create, who owns it and where to share it, with a first draft.
6. **Deliver:** put it in my feed, email me the important ones, and send a digest every Monday.

It also tracks what competitors publish and which topics they build, flags when they [rewrite a page for a different search intent](/blog/competitor-search-intent-change), keeps my comparison pages current, and checks who AI tools recommend for my buyers' questions.

## Built in public

I built Riposte in nine phases, testing each one live and writing down what broke and how I fixed it. You can see every step on the [changelog](/changelog).

If you're a marketer who spends too much time watching competitors and not enough time responding, I'd love to hear how you do it today. You can find me on [LinkedIn](https://www.linkedin.com/in/saniya-gazala-627889186).
