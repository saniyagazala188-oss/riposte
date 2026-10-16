import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { CONTACT_EMAIL, LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy · Riposte",
  description: "What Riposte collects, why, who helps run it, and how to delete your data.",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Privacy"
      title="Privacy policy"
      intro={
        <>
          Riposte is a competitive intelligence tool for marketers, run by Saniya Gazala from Bengaluru, India. It is in a free,
          invite-only beta. This page explains, in plain words, what Riposte collects, why, and what you can do about it. Questions:{" "}
          {mail}.
        </>
      }
      sections={[
        {
          heading: "What Riposte collects",
          body: (
            <ul>
              <li>
                <strong>Your account:</strong> your email address and password (stored scrambled, never readable). If you use
                &quot;Continue with Google&quot;, Google shares your name, email address and profile picture. Nothing else from your
                Google account.
              </li>
              <li>
                <strong>Waitlist details:</strong> what you typed when you joined the waitlist, such as your email and role.
              </li>
              <li>
                <strong>What you tell Riposte:</strong> your product details, the competitors and pages you track, prompts you
                save, and your alert settings (including a Slack webhook address if you add one).
              </li>
              <li>
                <strong>Files you upload:</strong> PDF and Word files in your knowledge base, plus the text Riposte reads from them
                and the summary it writes.
              </li>
              <li>
                <strong>What Riposte creates for you:</strong> snapshots of competitors&apos; public pages, detected changes,
                signals, action kits, briefs and comparisons.
              </li>
              <li>
                <strong>Feedback</strong> you send through the app.
              </li>
            </ul>
          ),
        },
        {
          heading: "Why",
          body: (
            <p>
              Only to run Riposte for you: to log you in, check the competitor pages you chose, explain changes for your product,
              send the alerts you switched on, and improve the product from your feedback. Riposte does not sell your data and does not
              show ads. It uses cookies to keep you logged in, and Google Analytics cookies to count visits and see which pages
              people use (for example, how many people join the waitlist). No advertising cookies.
            </p>
          ),
        },
        {
          heading: "Who helps run Riposte",
          body: (
            <>
              <p>A few services process data on Riposte&apos;s behalf:</p>
              <ul>
                <li>
                  <strong>Supabase</strong>: the database, file storage and login. Your files sit in a private storage area only your
                  account can open.
                </li>
                <li>
                  <strong>Vercel</strong>: hosts the website and runs the daily checks.
                </li>
                <li>
                  <strong>Google (Gemini API)</strong>: the AI that reads changes and your files and writes the explanations.
                  Riposte uses Google&apos;s paid Gemini API, where Google doesn&apos;t use what Riposte sends to improve its
                  products.
                </li>
                <li>
                  <strong>Google sign-in</strong>, if you choose it.
                </li>
                <li>
                  <strong>Google Analytics</strong>: counts visits and actions like joining the waitlist. It sees pages viewed and
                  general device and location info, not the content of your account.
                </li>
                <li>
                  <strong>Resend</strong> sends emails, and <strong>Slack</strong> receives alerts only if you connect it.
                </li>
              </ul>
              <p>These services may store data outside India, including in the United States.</p>
            </>
          ),
        },
        {
          heading: "Competitor pages",
          body: (
            <p>
              Riposte reads public web pages and public news about the companies you track, follows each site&apos;s robots.txt
              rules, and identifies itself as RiposteBot. It does not log in to other sites or collect personal data about
              people at those companies.
            </p>
          ),
        },
        {
          heading: "How long it's kept, and deleting it",
          body: (
            <p>
              Your data stays while your account is open. You can delete files, competitors and history yourself in the app. To
              delete your whole account and everything in it, email {mail} from your account email, and it will be removed
              within 30 days. You can also ask for a copy of your data the same way.
            </p>
          ),
        },
        {
          heading: "Security",
          body: (
            <p>
              Every account can only see its own data (enforced in the database), connections are encrypted, and secret keys are
              never stored in the website&apos;s code. No system is perfect, so if something goes wrong that affects you, you&apos;ll
              be told.
            </p>
          ),
        },
        {
          heading: "Changes",
          body: (
            <p>
              If this policy changes, the date at the top changes, and important changes are announced in the app or by email. See
              also the <Link href="/terms">terms of use</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
