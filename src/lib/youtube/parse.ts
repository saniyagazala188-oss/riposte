// Pure helpers for YouTube: no network here, so they can be tested.

export type ChannelRef =
  | { kind: "id"; value: string } // UC… channel id
  | { kind: "handle"; value: string } // @acme
  | { kind: "username"; value: string } // /user/acme (old style)
  | { kind: "custom"; value: string }; // /c/acme (old style)

export type VideoItem = {
  id: string; // the video address, so the same video is never reported twice
  videoId: string;
  title: string;
  link: string;
  date: string | null;
  summary?: string; // start of the description
  views?: number | null;
  short?: boolean; // a YouTube Short (up to 3 minutes, vertical)
};

const CHANNEL_ID = /^UC[\w-]{22}$/;

// Reads a channel from anything a marketer might paste: a channel link, an @handle,
// /c/ or /user/ links, or the channel's feed address.
export function parseChannelRef(input: string): ChannelRef | null {
  const raw = input.trim();
  if (!raw) return null;
  if (CHANNEL_ID.test(raw)) return { kind: "id", value: raw };
  if (/^@[\w.-]{3,}$/.test(raw)) return { kind: "handle", value: raw };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "").toLowerCase();
  if (host !== "youtube.com") return null;
  const feedId = url.searchParams.get("channel_id");
  if (url.pathname.startsWith("/feeds/videos.xml") && feedId && CHANNEL_ID.test(feedId)) return { kind: "id", value: feedId };
  const parts = url.pathname.split("/").filter(Boolean);
  if (!parts.length) return null;
  if (parts[0] === "channel" && parts[1] && CHANNEL_ID.test(parts[1])) return { kind: "id", value: parts[1] };
  if (parts[0].startsWith("@") && parts[0].length > 3) return { kind: "handle", value: decodeURIComponent(parts[0]) };
  if (parts[0] === "user" && parts[1]) return { kind: "username", value: parts[1] };
  if (parts[0] === "c" && parts[1]) return { kind: "custom", value: parts[1] };
  return null;
}

// The first link to a YouTube channel on a web page (usually in the footer's social icons).
// Skips links to single videos, embeds and playlists.
export function findChannelLink(html: string): string | null {
  const hrefs = html.match(/href\s*=\s*["'][^"']*youtube\.com[^"']*["']/gi) ?? [];
  for (const h of hrefs) {
    const href = h.replace(/^href\s*=\s*["']|["']$/gi, "").replace(/&amp;/g, "&");
    if (/\/(watch|embed|shorts|playlist|results|live)\b/i.test(href)) continue;
    if (parseChannelRef(href)) return href.startsWith("//") ? `https:${href}` : href;
  }
  return null;
}

// Finds the channel id inside a YouTube channel page's HTML.
export function channelIdFromHtml(html: string): string | null {
  const patterns = [
    /<link\s+rel=["']canonical["']\s+href=["']https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})/i,
    /"externalId"\s*:\s*"(UC[\w-]{22})"/,
    /<meta\s+itemprop=["'](?:identifier|channelId)["']\s+content=["'](UC[\w-]{22})/i,
    /"channelId"\s*:\s*"(UC[\w-]{22})"/,
    /youtube\.com\/channel\/(UC[\w-]{22})/,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return null;
}

export const channelUrl = (id: string) => `https://www.youtube.com/channel/${id}`;
export const feedUrl = (id: string) => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;
export const uploadsPlaylist = (id: string) => `UU${id.slice(2)}`;
export const channelIdFromUrl = (url: string) => {
  const ref = parseChannelRef(url);
  return ref?.kind === "id" ? ref.value : null;
};

// "PT1M5S" → 65 seconds.
export function isoDurationSeconds(d: string | undefined | null): number | null {
  const m = d?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, days, h, min, s] = m.map((x) => Number(x ?? 0));
  return days * 86400 + h * 3600 + min * 60 + s;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

type PlaylistResponse = {
  items?: { snippet?: { title?: string; description?: string; publishedAt?: string; resourceId?: { videoId?: string } }; contentDetails?: { videoId?: string; videoPublishedAt?: string } }[];
};
type VideosResponse = { items?: { id: string; statistics?: { viewCount?: string }; contentDetails?: { duration?: string } }[] };

// Turns YouTube Data API answers (the channel's uploads list plus video details) into video items.
export function videosFromApi(list: PlaylistResponse, details?: VideosResponse): VideoItem[] {
  const byId = new Map((details?.items ?? []).map((v) => [v.id, v]));
  return (list.items ?? [])
    .map((it) => {
      const videoId = it.contentDetails?.videoId ?? it.snippet?.resourceId?.videoId ?? "";
      const title = (it.snippet?.title ?? "").trim();
      if (!videoId || !title || title === "Private video" || title === "Deleted video") return null;
      const d = byId.get(videoId);
      const seconds = isoDurationSeconds(d?.contentDetails?.duration);
      const link = `https://www.youtube.com/watch?v=${videoId}`;
      const item: VideoItem = {
        id: link,
        videoId,
        title,
        link,
        date: it.contentDetails?.videoPublishedAt ?? it.snippet?.publishedAt ?? null,
        summary: clip((it.snippet?.description ?? "").replace(/\s+/g, " ").trim(), 400) || undefined,
        views: d?.statistics?.viewCount != null ? Number(d.statistics.viewCount) : null,
        short: seconds != null ? seconds <= 180 : undefined,
      };
      return item;
    })
    .filter((v): v is VideoItem => !!v);
}

// The free public feed (Atom): title, link, date and description of the latest 15 videos.
export function videosFromFeed(xmlText: string): VideoItem[] | null {
  if (!/<feed\b/i.test(xmlText.slice(0, 3000))) return null;
  const decode = (s: string) =>
    s
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  const out: VideoItem[] = [];
  for (const m of xmlText.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const e = m[1];
    const videoId = e.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/i)?.[1]?.trim();
    const title = decode(e.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    if (!videoId || !title) continue;
    const link = `https://www.youtube.com/watch?v=${videoId}`;
    const views = e.match(/<media:statistics[^>]*views=["'](\d+)["']/i)?.[1];
    const desc = decode(e.match(/<media:description[^>]*>([\s\S]*?)<\/media:description>/i)?.[1] ?? "").replace(/\s+/g, " ");
    const shortLink = /<link[^>]*href=["'][^"']*\/shorts\//i.test(e);
    out.push({
      id: link,
      videoId,
      title,
      link,
      date: e.match(/<published>([\s\S]*?)<\/published>/i)?.[1]?.trim() ?? null,
      summary: clip(desc, 400) || undefined,
      views: views ? Number(views) : null,
      short: shortLink || undefined,
    });
  }
  return out;
}
