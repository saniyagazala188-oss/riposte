import "server-only";
import { fetchPage } from "@/lib/discovery";
import { channelIdFromHtml, channelUrl, feedUrl, parseChannelRef, uploadsPlaylist, videosFromApi, videosFromFeed, type VideoItem } from "./parse";

// YouTube for Riposte. With YOUTUBE_API_KEY set (free: YouTube Data API v3 in Google Cloud,
// 10,000 units a day; one channel check costs about 2), Riposte uses the official API and also
// gets view counts. Without it, it falls back to the channel's free public feed.

const API = "https://www.googleapis.com/youtube/v3";
const key = () => process.env.YOUTUBE_API_KEY?.trim() || "";
export const youtubeApiConfigured = () => !!key();

async function api<T>(path: string, params: Record<string, string>): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: key() })}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = (body as { error?: { errors?: { reason?: string }[]; message?: string } }).error;
      const why = reason?.errors?.[0]?.reason ?? "";
      if (why === "quotaExceeded" || why === "dailyLimitExceeded") return { ok: false, message: "YouTube's daily limit was reached. Riposte will try again tomorrow." };
      if (res.status === 400 || res.status === 403) return { ok: false, message: "YouTube didn't accept the API key. Check YOUTUBE_API_KEY in Vercel." };
      return { ok: false, message: `YouTube answered with status ${res.status}.` };
    }
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, message: "YouTube didn't respond in time." };
  } finally {
    clearTimeout(timer);
  }
}

// Turns a pasted channel link or @handle into the channel id. Returns null if it can't be found.
export async function resolveChannel(input: string): Promise<{ id: string; url: string } | null> {
  const ref = parseChannelRef(input);
  if (!ref) return null;
  if (ref.kind === "id") return { id: ref.value, url: channelUrl(ref.value) };

  if (youtubeApiConfigured()) {
    const param: Record<string, string> | null =
      ref.kind === "handle" ? { forHandle: ref.value } : ref.kind === "username" ? { forUsername: ref.value } : null;
    if (param) {
      const r = await api<{ items?: { id: string }[] }>("channels", { part: "id", ...param });
      const id = r.ok ? r.data.items?.[0]?.id : undefined;
      if (id) return { id, url: channelUrl(id) };
    }
  }
  // Read the channel page and find its id (works for @handles and /c/ links too).
  const page =
    ref.kind === "handle"
      ? `https://www.youtube.com/${ref.value}`
      : ref.kind === "username"
        ? `https://www.youtube.com/user/${ref.value}`
        : `https://www.youtube.com/c/${ref.value}`;
  try {
    const res = await fetchPage(page);
    const id = res.ok ? channelIdFromHtml(res.text) : null;
    return id ? { id, url: channelUrl(id) } : null;
  } catch {
    return null;
  }
}

async function isShort(videoId: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, { method: "HEAD", redirect: "manual", signal: controller.signal, cache: "no-store" });
    return res.status === 200;
  } catch {
    return false; // when unsure, don't label it
  } finally {
    clearTimeout(timer);
  }
}

// The latest videos on a channel, newest first.
export async function latestVideos(channelId: string): Promise<{ ok: true; items: VideoItem[] } | { ok: false; message: string }> {
  if (youtubeApiConfigured()) {
    type List = Parameters<typeof videosFromApi>[0];
    const list = await api<List>("playlistItems", { part: "snippet,contentDetails", playlistId: uploadsPlaylist(channelId), maxResults: "15" });
    if (!list.ok) return list;
    const ids = (list.data.items ?? []).map((i) => i.contentDetails?.videoId).filter(Boolean) as string[];
    const details = ids.length ? await api<Parameters<typeof videosFromApi>[1]>("videos", { part: "statistics,contentDetails", id: ids.join(",") }) : null;
    const items = videosFromApi(list.data, details?.ok ? details.data : undefined);
    // A video under 3 minutes is only a Short if its /shorts/ address opens as a Short
    // (normal videos are redirected to /watch).
    await Promise.all(items.filter((v) => v.short).map(async (v) => (v.short = await isShort(v.videoId))));
    return { ok: true, items };
  }
  try {
    const res = await fetchPage(feedUrl(channelId), { large: true });
    if (res.status === 404) return { ok: false, message: "This YouTube channel couldn't be found." };
    if (!res.ok) return { ok: false, message: `YouTube refused the request (status ${res.status}). Adding a YouTube API key fixes this.` };
    const items = videosFromFeed(res.text);
    return items ? { ok: true, items } : { ok: false, message: "YouTube's feed couldn't be read this time." };
  } catch {
    return { ok: false, message: "YouTube didn't respond in time." };
  }
}
