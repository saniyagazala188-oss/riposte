// AI crawlers and search engine bots, matched by their user agent.
// purpose: training = collects pages to train models; search = builds an AI search index;
// user = fetches a page live because someone asked the AI about it; search-engine = classic search.
export type Bot = { name: string; company: string; purpose: "training" | "search" | "user" | "search-engine" };

const BOTS: [RegExp, Bot][] = [
  [/GPTBot/i, { name: "GPTBot", company: "OpenAI", purpose: "training" }],
  [/OAI-SearchBot/i, { name: "OAI-SearchBot", company: "OpenAI", purpose: "search" }],
  [/ChatGPT-User/i, { name: "ChatGPT-User", company: "OpenAI", purpose: "user" }],
  [/ClaudeBot/i, { name: "ClaudeBot", company: "Anthropic", purpose: "training" }],
  [/Claude-SearchBot/i, { name: "Claude-SearchBot", company: "Anthropic", purpose: "search" }],
  [/Claude-User/i, { name: "Claude-User", company: "Anthropic", purpose: "user" }],
  [/PerplexityBot/i, { name: "PerplexityBot", company: "Perplexity", purpose: "search" }],
  [/Perplexity-User/i, { name: "Perplexity-User", company: "Perplexity", purpose: "user" }],
  [/Google-CloudVertexBot|GoogleOther/i, { name: "GoogleOther", company: "Google", purpose: "training" }],
  [/Googlebot/i, { name: "Googlebot", company: "Google", purpose: "search-engine" }],
  [/bingbot/i, { name: "Bingbot", company: "Microsoft", purpose: "search-engine" }],
  [/Applebot/i, { name: "Applebot", company: "Apple", purpose: "search" }],
  [/meta-externalagent|meta-externalfetcher/i, { name: "Meta AI", company: "Meta", purpose: "training" }],
  [/Amazonbot/i, { name: "Amazonbot", company: "Amazon", purpose: "training" }],
  [/Bytespider/i, { name: "Bytespider", company: "ByteDance", purpose: "training" }],
  [/CCBot/i, { name: "CCBot", company: "Common Crawl", purpose: "training" }],
  [/DuckAssistBot/i, { name: "DuckAssistBot", company: "DuckDuckGo", purpose: "user" }],
  [/MistralAI-User/i, { name: "MistralAI-User", company: "Mistral", purpose: "user" }],
  [/YouBot/i, { name: "YouBot", company: "You.com", purpose: "search" }],
];

export function detectBot(userAgent: string | null): Bot | null {
  if (!userAgent) return null;
  for (const [re, bot] of BOTS) if (re.test(userAgent)) return bot;
  return null;
}

export const PURPOSE_LABEL: Record<Bot["purpose"], string> = {
  training: "Collects pages for AI training",
  search: "Builds an AI search index",
  user: "Read a page live for someone's question",
  "search-engine": "Classic search engine",
};
