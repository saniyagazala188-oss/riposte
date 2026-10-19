---
title: "How to get competitor alerts in Slack (step-by-step setup)"
metaTitle: "Competitor Alerts in Slack: 5-Minute Setup Guide"
description: "Get competitor changes posted to a Slack channel: what changed, why it matters and who does what. A step-by-step guide to connecting Riposte to Slack."
summary: "To get competitor alerts in Slack with Riposte: create a small Slack app at api.slack.com/apps with the incoming-webhook permission, install it to the channel you want, copy its webhook link into Riposte's Settings, and turn on Interactivity with Riposte's Request URL. High-impact competitor changes are then posted to that channel the morning they're found, with what changed, why it matters, what to do and who does what, plus a summary every Monday."
date: "2026-10-19"
updated: "2026-10-19"
keywords: ["competitor alerts in Slack", "competitor monitoring Slack", "Slack competitive intelligence", "Slack incoming webhook alerts"]
tags: ["Guide", "Product"]
faqs:
  - q: "Can I get competitor alerts in Slack?"
    a: "Yes. Riposte posts high-impact competitor changes to a Slack channel of your choice, with what changed, why it matters, what to do and who does what. You connect it once in about five minutes."
  - q: "Is the Slack integration free?"
    a: "Yes. Slack alerts are part of Riposte, which is free during its beta, and they work on Slack's free plan."
  - q: "Which competitor changes are sent to Slack?"
    a: "High-impact changes, such as a price change, a launch that overlaps your product or a positioning shift aimed at your buyers, are posted the morning they're found. Every Monday, a summary of the week's changes is posted too, most important first."
  - q: "What does a Riposte Slack alert include?"
    a: "Each alert shows the competitor, the impact and type of change, what changed, why it matters to you and what to do. If an action kit was built, it also lists who does what, how soon and where to share it, with buttons to open it in Riposte."
  - q: "Can I send alerts to more than one Slack channel?"
    a: "Right now each Riposte account posts to one channel. Pick the channel your team already reads, such as #competitive-intel or #sales."
  - q: "Is the Slack webhook link safe to share?"
    a: "No. Anyone who has your webhook link can post messages in your channel, so only paste it into Riposte's Settings. If it leaks, open Incoming Webhooks in your Slack app, remove it and add a new one."
  - q: "Why does Slack show a warning icon when I click a button?"
    a: "Slack tells the app about every button click. If Interactivity isn't set up, Slack shows a warning icon. Turn Socket Mode off and add Riposte's Request URL under Interactivity & Shortcuts to fix it."
  - q: "Do I need to be a Slack admin to connect Riposte?"
    a: "Not always. Many workspaces let members install their own apps, but some admins require approval. If you can't install the app, ask your Slack admin to approve it."
  - q: "Can I get competitor alerts by email instead of Slack?"
    a: "Yes. Riposte can also send high-impact alerts and the Monday summary by email. Turn each one on or off in Settings, and use email, Slack or both."
  - q: "How do I stop Riposte alerts in Slack?"
    a: "Open Riposte's Settings, clear the Slack box and click Save. You can also remove the Riposte app from your Slack workspace."
cover: "/blog/covers/competitor-alerts-in-slack.jpg"
coverAlt: "A Riposte competitor alert in Slack showing what changed, why it matters and who does what"
verdict: "Competitor news is most useful where your team already talks. Connect Riposte to one Slack channel, and every important change arrives with the reason it matters and the next step, not just a link."
cta: "action-kits"
related: ["riposte-action-kits", "sales-battlecard-template", "what-riposte-does"]
---

Most competitor alerts die in an inbox. Riposte posts them where your team already talks, and each one says **what changed, why it matters and who does what**.

Setup takes about five minutes, once.

## What you'll get in Slack

![A Riposte competitor alert in Slack](/blog/slack/6-slack-alert.jpg "Example alert with sample data")

High-impact changes arrive the morning they're found, and a summary of the week every Monday. If an [action kit](/blog/riposte-action-kits) exists, the alert also lists who does what.

## Before you start

You need a Riposte account with a competitor added, and a Slack channel your team already reads, such as **#competitor-alerts** or **#sales**.

:::note Company Slack?
Some workspaces need an admin to approve new apps. If Slack asks for approval, send the request to your admin.
:::

## Step 1: Create a Slack app

Open [api.slack.com/apps](https://api.slack.com/apps), click **Create an App**, choose **From scratch** and name it **Riposte**.

![Create a Slack app from scratch named Riposte](/blog/slack/step-1-create-app.jpg)

## Step 2: Add one permission

Search for **incoming-webhook** and add it. Skip events. Riposte only posts messages; it never reads your Slack.

![Add the incoming-webhook permission](/blog/slack/step-2-permission.jpg)

## Step 3: Install it to your channel

Click **Create and Install**, pick your channel and click **Allow**.

![Pick the channel for alerts and allow](/blog/slack/step-3-channel.jpg)

## Step 4: Copy the link into Riposte

In **Incoming Webhooks**, copy your channel's link. Paste it into the **Slack** box in Riposte's **Settings** and click **Save**.

![Copy the webhook link and paste it into Riposte Settings](/blog/slack/step-4-paste-link.jpg)

:::important Keep the link private
Anyone with it can post in your channel. Paste it only into Riposte.
:::

## Step 5: Turn on button clicks

Make sure **Socket Mode** is off. Turn **Interactivity** on and paste `https://useriposte.com/api/slack/interactions` as the Request URL, then save. This stops Slack showing a warning icon when you click a button.

![Socket Mode off, Interactivity on with Riposte's address](/blog/slack/step-5-interactivity.jpg)

## Step 6: Send a test

In Riposte's **Settings**, click **Send a test to Slack**. You'll get a real example from your own feed.

![Send a test from Riposte and see the alert in Slack](/blog/slack/step-6-test.jpg)

Nothing arrived? Check the link was saved in Settings, and look in the channel you picked in step 3.

:::read riposte-action-kits

## Wrapping up

That's it. Riposte checks your competitors every morning, and your team sees what matters in Slack, with the next step. Pair it with a [battlecard](/blog/sales-battlecard-template) your team trusts.
