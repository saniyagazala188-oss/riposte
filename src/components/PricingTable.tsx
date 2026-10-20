"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS, type Currency, type Billing } from "@/lib/pricing";

// Plan cards with two switches: monthly / yearly and USD / INR.
// During the beta nothing can be bought: every button joins the free beta.
export function PricingTable() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [currency, setCurrency] = useState<Currency>("usd");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Toggle
          label="Billing"
          value={billing}
          onChange={(v) => setBilling(v as Billing)}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly · 2 months free" },
          ]}
        />
        <Toggle
          label="Currency"
          value={currency}
          onChange={(v) => setCurrency(v as Currency)}
          options={[
            { value: "usd", label: "USD $" },
            { value: "inr", label: "INR ₹" },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = p.price[currency];
          const shown = billing === "monthly" ? price.monthly : price.yearlyPerMonth;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-surface p-7 shadow-sm ${
                p.popular ? "border-accent ring-4 ring-accent-soft" : "border-line"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-2xl font-bold">{p.name}</h2>
              <p className="mt-1 min-h-[2.5rem] text-sm text-muted">{p.forWho}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold tracking-tight">{shown}</span>
                <span className="text-muted">/ month</span>
              </p>
              <p className="mt-1 h-5 text-sm text-muted">
                {billing === "yearly" ? `Billed ${price.yearly} a year` : "Billed monthly · cancel any time"}
              </p>
              <Link
                href="#join"
                className={`mt-6 rounded-xl px-4 py-3 text-center font-semibold ${
                  p.popular ? "bg-accent text-accent-ink hover:opacity-90" : "border border-line hover:border-muted"
                }`}
              >
                Join the free beta
              </Link>
              <p className="mt-2 text-center text-xs text-muted">Free during the beta · 7-day free trial after launch</p>
              <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-6 text-[15px]">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className="mt-0.5 font-bold text-accent" aria-hidden>
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {currency === "inr" && (
        <p className="mt-4 text-center text-xs text-muted">INR prices are for customers in India. Taxes may apply.</p>
      )}
    </div>
  );
}

function Toggle({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === o.value ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
