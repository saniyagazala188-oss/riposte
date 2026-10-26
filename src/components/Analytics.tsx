import Script from "next/script";
import { GA_ID } from "@/lib/analytics";
import { AnalyticsGate } from "@/components/AnalyticsGate";

// Loads Google Analytics on the live site only (not in local previews).
// Not tracked: the signed-in app (/app/...), and any device where the owner opened useriposte.com/?notrack.
export function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;
  const off = `window['ga-disable-${GA_ID}']=(function(){try{var q=new URLSearchParams(location.search);if(q.has('notrack'))localStorage.setItem('riposte_notrack','1');if(q.has('track'))localStorage.removeItem('riposte_notrack');return localStorage.getItem('riposte_notrack')==='1'||/^\\/app(\\/|$)/.test(location.pathname);}catch(e){return /^\\/app(\\/|$)/.test(location.pathname);}})();`;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`${off}window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      <AnalyticsGate id={GA_ID} />
    </>
  );
}
