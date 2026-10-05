import { requireUser } from "@/lib/auth";
import { card } from "@/components/styles";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Your product · Riposte" };

const USES = [
  { title: "Signals", body: "Every competitor change is judged against who you sell to: the same price rise can be noise or a threat." },
  { title: "Action kits", body: "Battlecards, talk tracks and posts pivot to what makes you different, not generic lines." },
  { title: "Prompt Studio", body: "Buyer prompts match your category, buyers and the niches you want to win." },
  { title: "Comparisons", body: "Your side of each comparison page comes only from here; anything missing becomes a [placeholder]." },
];

export default async function ProductPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer, differentiators")
    .eq("id", user.id)
    .maybeSingle();
  const filled = [profile?.product_name, profile?.product_pitch, profile?.ideal_customer, profile?.differentiators].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        kicker="Your product"
        title="Tell Riposte what you sell"
        description="Every signal, draft and comparison is written for your product. The more specific this is, the sharper the advice."
      />
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${card} p-5 sm:p-6`}>
          <ProductForm
            product_name={profile?.product_name ?? ""}
            product_pitch={profile?.product_pitch ?? ""}
            ideal_customer={profile?.ideal_customer ?? ""}
            differentiators={profile?.differentiators ?? ""}
          />
        </section>
        <aside className="flex flex-col gap-4">
          <section className={`${card} p-5`}>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold">Profile</h2>
              <span className={`text-sm font-semibold ${filled === 4 ? "text-accent" : "text-signal"}`}>{filled} of 4 filled</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-bg" aria-hidden>
              <div className="h-2 rounded-full bg-accent" style={{ width: `${(filled / 4) * 100}%` }} />
            </div>
          </section>
          <section className={`${card} p-5`}>
            <h2 className="font-display text-lg font-bold">Where Riposte uses this</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {USES.map((u) => (
                <li key={u.title}>
                  <p className="font-semibold">{u.title}</p>
                  <p className="text-muted">{u.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
