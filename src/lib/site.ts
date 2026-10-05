// Facts about the public site, used in metadata, schema and the about page.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://riposte-eta.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Riposte";
export const SITE_TAGLINE = "Competitive intelligence for marketers";

export const AUTHOR = {
  slug: "saniya-gazala",
  name: "Saniya Gazala",
  role: "Founder of Riposte · Product marketer",
  location: "Bengaluru, India",
  linkedin: "https://www.linkedin.com/in/saniya-gazala-627889186",
  short:
    "Product marketer who builds. Before Riposte, Saniya spent three years at TestMu AI (LambdaTest), first as a technical content writer and then as the product marketing manager for KaneAI.",
};

export const personSchema = {
  "@type": "Person",
  name: AUTHOR.name,
  jobTitle: "Founder, Riposte",
  url: `${SITE_URL}/about`,
  sameAs: [AUTHOR.linkedin],
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
};

export const organizationSchema = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  founder: { "@type": "Person", name: AUTHOR.name },
};
