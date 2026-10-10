"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart } from "lucide-react";
import Photo from "../Photo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rupees } from "@/lib/site";
import type { Product } from "@/lib/types";

const PREVIEW_COUNT = 4;

/**
 * Product grid. `preview` = short version for the home page (first few products and a
 * "View all" link); otherwise the full shop with category filters.
 */
export default function Shop({ preview = false }: { preview?: boolean }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!isSupabaseConfigured) return setProducts([]);
    createClient()
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const categories = useMemo(() => {
    const set = new Set((products ?? []).map((p) => p.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = (products ?? []).filter((p) => category === "All" || p.category === category);
  const shown = preview ? filtered.slice(0, PREVIEW_COUNT) : filtered;
  const Heading = preview ? "h2" : "h1";

  return (
    <section id="shop" className={`section bg-dumbbells bg-brand-ink ${preview ? "" : "min-h-[70svh] pt-28 md:pt-32"}`}>
      <div className="container-x">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Gym Store</p>
            <Heading className="heading mt-5">
              Fuel Your <span className="text-brand-red">Gains</span>
            </Heading>
          </div>
          <p className="max-w-md text-sm text-fg/60">
            Supplements and gear from the gym. Order online, pay by UPI or cash, and collect it at the counter.
          </p>
        </div>

        {!preview && categories.length > 2 && (
          <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  category === c ? "border-brand-red bg-brand-red text-white" : "border-brand-line text-fg/60 hover:text-fg"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {products === null ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-brand-card" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="mt-8 flex flex-col items-center border border-dashed border-brand-line px-4 py-14 text-center">
            <ShoppingBag className="h-10 w-10 text-brand-red/60" strokeWidth={1.5} />
            <p className="mt-4 font-display text-2xl tracking-wide">Products coming soon</p>
            <p className="mt-1 text-sm text-brand-muted">Ask at the gym counter for supplements and gear.</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ul>
        )}

        {preview && (products?.length ?? 0) > 0 && (
          <div className="mt-8 text-center">
            <Link href="/shop" className="btn-ghost">
              View all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product: p }: { product: Product }) {
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <li className="flex flex-col border border-brand-line bg-brand-card">
      <div className="relative">
        <Photo
          src={p.image_url ?? ""}
          alt={p.name}
          className="aspect-square w-full bg-white"
        />
        {off > 0 && (
          <span className="absolute left-2 top-2 bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {off}% off
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {p.category && <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-red">{p.category}</p>}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{p.name}</h3>
        {p.description && <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{p.description}</p>}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
          <span className="font-display text-2xl leading-none sm:text-3xl">{rupees(p.price)}</span>
          {off > 0 && <span className="text-xs text-brand-muted line-through">{rupees(p.mrp!)}</span>}
        </p>
        <Link href={`/shop/checkout?product=${p.id}`} className="btn-primary btn-sm mt-3 w-full">
            <ShoppingCart className="h-3.5 w-3.5" /> Order Now
          </Link>
      </div>
    </li>
  );
}
