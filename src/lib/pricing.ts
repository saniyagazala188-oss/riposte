// Riposte's planned prices after the beta. Nothing is charged yet: the beta is free.
// Yearly = pay for 10 months, get 12.

export type Currency = "usd" | "inr";
export type Billing = "monthly" | "yearly";

type Price = { monthly: string; yearly: string; yearlyPerMonth: string };

export type Plan = {
  id: "starter" | "pro" | "team";
  name: string;
  forWho: string;
  popular?: boolean;
  price: Record<Currency, Price>;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    forWho: "For one marketer keeping an eye on a couple of rivals.",
    price: {
      usd: { monthly: "$19", yearly: "$190", yearlyPerMonth: "$16" },
      inr: { monthly: "₹1,499", yearly: "₹14,990", yearlyPerMonth: "₹1,249" },
    },
    features: [
      "2 competitors",
      "Pricing, release notes, blog and sitemap checked every morning",
      "Each change explained for your product",
      "Noise filtered out",
      "Email alerts and a Monday summary",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    forWho: "For product marketers, content and SEO teams.",
    popular: true,
    price: {
      usd: { monthly: "$49", yearly: "$490", yearlyPerMonth: "$41" },
      inr: { monthly: "₹3,999", yearly: "₹39,990", yearlyPerMonth: "₹3,333" },
    },
    features: [
      "5 competitors",
      "Everything in Starter",
      "Action kits with first drafts",
      "Slack alerts",
      "News and YouTube tracking",
      "Knowledge base: your own docs",
      "Comparison pages and content intel",
      "Prompt Studio and AI visibility (10 prompts)",
    ],
  },
  {
    id: "team",
    name: "Team",
    forWho: "For teams tracking a whole market.",
    price: {
      usd: { monthly: "$99", yearly: "$990", yearlyPerMonth: "$83" },
      inr: { monthly: "₹7,999", yearly: "₹79,990", yearlyPerMonth: "₹6,666" },
    },
    features: ["15 competitors", "Everything in Pro", "30 tracked AI prompts", "Priority help from me"],
  },
];

export const PRICING_FAQS: { q: string; a: string }[] = [
  {
    q: "Is Riposte free right now?",
    a: "Yes. Riposte is in a free, invite-only beta. You won't be charged anything during the beta, and you'll get 30 days' notice before any pricing starts.",
  },
  {
    q: "What do beta users pay after launch?",
    a: "Beta users get a founding-member price, lower than the prices on this page, and keep it for as long as they stay subscribed.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. After launch, every plan starts with a 7-day free trial. During the beta, everything is free anyway.",
  },
  {
    q: "Can I pay monthly or yearly?",
    a: "Both. Monthly plans can be cancelled any time. Yearly plans give you 2 months free.",
  },
  {
    q: "Can I pay in Indian rupees?",
    a: "Yes. Customers in India can pay in INR. Everyone else pays in USD.",
  },
  {
    q: "What counts as a competitor?",
    a: "One company you track. For each one, Riposte checks their pricing page, release notes, blog, sitemap, news coverage and YouTube channel, plus any other page you add.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can move up or down at any time, and the change applies from your next bill.",
  },
  {
    q: "How is Riposte different from enterprise competitive intelligence tools?",
    a: "Enterprise tools are built for large teams with an analyst and a long setup. Riposte is built for small teams: it sets up in minutes, explains each change for your product and drafts the response, at a price a small team can pay.",
  },
];
