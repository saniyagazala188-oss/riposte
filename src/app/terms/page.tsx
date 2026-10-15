import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { CONTACT_EMAIL, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of use · Riposte",
  description: "The simple rules for using Riposte during its free beta.",
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Terms"
      title="Terms of use"
      intro={
        <>
          These are the simple rules for using Riposte, run by Saniya Gazala from Bengaluru, India. By using Riposte you agree to
          them. Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </>
      }
      sections={[
        {
          heading: "A free beta",
          body: (
            <p>
              Riposte is free while it is in beta and access is by invitation. Features, limits and availability can change, and
              the service may be paused or end. If paid plans come later, you&apos;ll be told before anything costs money.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <p>
              Keep your login private and give accurate details. You are responsible for what happens in your account. One person
              per account, please.
            </p>
          ),
        },
        {
          heading: "Fair use",
          body: (
            <ul>
              <li>Track public pages of companies for legitimate competitive research.</li>
              <li>Don&apos;t use Riposte to break the law, harass anyone, or collect personal data about people.</li>
              <li>Don&apos;t try to get around limits, break security, or overload Riposte or the sites it checks.</li>
              <li>Only upload files you have the right to use.</li>
            </ul>
          ),
        },
        {
          heading: "Your content",
          body: (
            <p>
              What you add (product details, files, prompts) stays yours. You let Riposte store and process it only to run the
              service for you, as described in the <Link href="/privacy">privacy policy</Link>. What Riposte drafts for you is yours
              to use.
            </p>
          ),
        },
        {
          heading: "AI can be wrong",
          body: (
            <p>
              Signals, action kits, briefs and comparisons are written by AI from public pages. They can miss things or get things
              wrong. Check anything important before you publish it, send it to customers or make decisions on it. Riposte is a
              starting point for your judgment, not a replacement for it.
            </p>
          ),
        },
        {
          heading: "No guarantees",
          body: (
            <p>
              Riposte is provided as it is, without promises that it will always be available or error-free. As far as the law
              allows, Riposte isn&apos;t liable for indirect losses or for decisions made using it.
            </p>
          ),
        },
        {
          heading: "Ending",
          body: (
            <p>
              You can stop using Riposte any time and ask for your account to be deleted. Accounts that break these rules may be
              suspended. These terms follow the laws of India. If they change, the date at the top changes.
            </p>
          ),
        },
      ]}
    />
  );
}
