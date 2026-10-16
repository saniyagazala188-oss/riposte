// Google Analytics 4. The measurement ID isn't a secret (it's visible in every page's HTML).
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-Z5CWL8R3NW";

type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

// Sends one event (waitlist join, sign-up, login…). Does nothing if analytics isn't loaded.
export function track(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.("event", name, params);
}
