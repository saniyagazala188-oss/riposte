import Script from "next/script";
import { GA_ID } from "@/lib/analytics";

// Loads Google Analytics on the live site only (not in local previews).
export function Analytics() {
  if (process.env.NODE_ENV !== "production" || !GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
