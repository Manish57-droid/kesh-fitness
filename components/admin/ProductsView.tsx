"use client";
import { useState } from "react";
import { Eye, EyeOff, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Photo from "../Photo";
import ProductForm, { storagePath } from "./ProductForm";
import { createClient } from "@/lib/supabase/client";
import { rupees } from "@/lib/site";
import type { Product } from "@/lib/types";

type Props = {
  initial: Product[];
};

const sortProducts = (list: Product[]) =>
  [...list].sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));

export default function ProductsView({ initial }: Props) {
  const [products, setProducts] = useState(initial);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[])).sort();
  const q = query.trim().toLowerCase();
  const shown = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
  );

  const patch = async (p: Product, changes: Partial<Product>) => {
    setError("");
    setProducts(products.map((x) => (x.id === p.id ? { ...x, ...changes } : x)));
    const { error } = await createClient().from("products").update(changes).eq("id", p.id);
    if (error) {
      setProducts(products);
      setError(error.message);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return setError(error.message);
    const path = storagePath(p.image_url);
    if (path) await supabase.storage.from("products").remove([path]);
    setProducts(products.filter((x) => x.id !== p.id));
  };

  const onSaved = (saved: Product) => {
    const exists = products.some((p) => p.id === saved.id);
    setProducts(sortProducts(exists ? products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...products]));
    setEditing(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input className="input pl-9" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <div className="mt-6 flex flex-col items-center border border-dashed border-brand-line px-4 py-12 text-center">
          <Package className="h-10 w-10 text-brand-muted" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-brand-muted">
            {products.length === 0 ? "No products yet. Add your first one." : "No products match your search."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-brand-line border border-brand-line">
          {shown.map((p) => (
            <li key={p.id} className={`flex items-center gap-3 bg-brand-card p-3 sm:gap-4 sm:p-4 ${p.is_active ? "" : "opacity-60"}`}>
              <Photo src={p.image_url ?? ""} alt={p.name} className="h-16 w-16 shrink-0 bg-white sm:h-20 sm:w-20" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-brand-muted">
                  {[p.category, `Order ${p.sort_order}`].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-xl leading-none">{rupees(p.price)}</span>
                  {p.mrp && p.mrp > p.price && <span className="text-xs text-brand-muted line-through">{rupees(p.mrp)}</span>}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => patch(p, { in_stock: !p.in_stock })}
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      p.in_stock ? "bg-emerald-600 text-white" : "bg-fg/15 text-fg"
                    }`}
                    title="Tap to toggle"
                  >
                    {p.in_stock ? "In stock" : "Out of stock"}
                  </button>
                  {!p.is_active && (
                    <span className="bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black">Hidden</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <button
                  onClick={() => patch(p, { is_active: !p.is_active })}
                  className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-fg"
                  aria-label={p.is_active ? `Hide ${p.name}` : `Show ${p.name}`}
                  title={p.is_active ? "Hide from website" : "Show on website"}
                >
                  {p.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditing(p)}
                  className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-fg"
                  aria-label={`Edit ${p.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(p)}
                  className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-brand-red"
                  aria-label={`Delete ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
