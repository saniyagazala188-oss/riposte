import { requireUser } from "@/lib/auth";
import { card, eyebrow } from "@/components/styles";
import { ProductForm } from "./ProductForm";

export const metadata = { title: "Your product · Riposte" };

export default async function ProductPage() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name, product_pitch, ideal_customer")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-2xl">
      <p className={eyebrow}>Your product</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Tell Riposte what you sell</h1>
      <p className="mt-2 text-muted">
        Every signal is judged against this. A competitor&apos;s price change means something different depending on who
        you sell to.
      </p>
      <div className={`${card} mt-6 p-5 sm:p-6`}>
        <ProductForm
          product_name={profile?.product_name ?? ""}
          product_pitch={profile?.product_pitch ?? ""}
          ideal_customer={profile?.ideal_customer ?? ""}
        />
      </div>
    </div>
  );
}
