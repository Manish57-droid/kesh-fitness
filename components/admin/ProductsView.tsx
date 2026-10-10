"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Eye, EyeOff, Minus, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
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
  const totalUnits = products.reduce((n, p) => n + (p.quantity ?? 0), 0);
  const lowStock = products.filter((p) => p.is_active && (p.quantity ?? 0) <= 2).length;

  /** Optimistic update; rolls back that product if the save fails. */
  const patch = async (id: number, changes: Partial<Product>) => {
    setError("");
    const before = products.find((p) => p.id === id);
    setProducts((list) => list.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    const { error } = await createClient().from("products").update(changes).eq("id", id);
    if (error) {
      if (before) setProducts((list) => list.map((x) => (x.id === id ? before : x)));
      setError(
        error.message.includes("quantity")
          ? "Stock quantity needs supabase/migrations/003_product_quantity.sql. Run it in the SQL Editor."
          : error.message
      );
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
    setProducts((list) => list.filter((x) => x.id !== p.id));
  };

  const onSaved = (saved: Product) => {
    setProducts((list) => {
      const exists = list.some((p) => p.id === saved.id);
      return sortProducts(exists ? list.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...list]);
    });
    setEditing(null);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Products", value: products.length },
          { label: "Units in stock", value: totalUnits },
          { label: "Low / out of stock", value: lowStock, red: lowStock > 0 },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`font-display text-4xl leading-none ${s.red ? "text-brand-red" : ""}`}>{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input className="input pl-9" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>
      <p className="mt-3 text-xs text-brand-muted">Tip: tap a price to change it. Use − / + to update stock.</p>
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
            <ProductRow
              key={p.id}
              product={p}
              onPatch={(changes) => patch(p.id, changes)}
              onEdit={() => setEditing(p)}
              onDelete={() => remove(p)}
            />
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

type RowProps = {
  product: Product;
  onPatch: (changes: Partial<Product>) => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ProductRow({ product: p, onPatch, onEdit, onDelete }: RowProps) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(String(p.price));
  // Quantity changes show instantly and are saved once the taps stop.
  const [qty, setQty] = useState(p.quantity ?? 0);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<(() => void) | null>(null);

  useEffect(() => setQty(p.quantity ?? 0), [p.quantity]);
  // Save any change still waiting if the admin leaves the page.
  useEffect(
    () => () => {
      clearTimeout(saveTimer.current);
      pending.current?.();
    },
    []
  );

  const changeQty = (delta: number) => {
    const next = Math.max(0, qty + delta);
    if (next === qty) return;
    setQty(next);
    clearTimeout(saveTimer.current);
    pending.current = () => {
      pending.current = null;
      onPatch({ quantity: next, in_stock: next > 0 });
    };
    saveTimer.current = setTimeout(() => pending.current?.(), 600);
  };

  const savePrice = () => {
    const value = Math.round(Number(price));
    if (!Number.isFinite(value) || value < 0) return;
    setEditingPrice(false);
    if (value !== p.price) onPatch({ price: value });
  };

  const cancelPrice = () => {
    setPrice(String(p.price));
    setEditingPrice(false);
  };

  return (
    <li className={`flex flex-col gap-3 bg-brand-card p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 ${p.is_active ? "" : "opacity-60"}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Photo src={p.image_url ?? ""} alt={p.name} className="h-16 w-16 shrink-0 bg-white sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.name}</p>
          <p className="text-xs text-brand-muted">{[p.category, `Order ${p.sort_order}`].filter(Boolean).join(" · ")}</p>

          {/* Price: tap to edit */}
          {editingPrice ? (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-sm text-brand-muted">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                autoFocus
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") savePrice();
                  if (e.key === "Escape") cancelPrice();
                }}
                className="input w-28 py-1.5"
                aria-label={`New price for ${p.name}`}
              />
              <button onClick={savePrice} className="flex h-9 w-9 items-center justify-center bg-brand-red text-white" aria-label="Save price">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={cancelPrice} className="flex h-9 w-9 items-center justify-center text-brand-muted hover:text-fg" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPrice(true)}
              className="group mt-1 flex items-baseline gap-2 text-left"
              title="Tap to change price"
            >
              <span className="font-display text-2xl leading-none group-hover:text-brand-red">{rupees(p.price)}</span>
              {p.mrp && p.mrp > p.price && <span className="text-xs text-brand-muted line-through">{rupees(p.mrp)}</span>}
              <Pencil className="h-3 w-3 text-brand-muted opacity-60 group-hover:text-brand-red" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {/* Stock stepper */}
        <div className="flex flex-col items-start gap-1 sm:items-center">
          <div className="flex items-center border border-brand-line">
            <button
              onClick={() => changeQty(-1)}
              disabled={qty === 0}
              className="flex h-10 w-10 items-center justify-center text-fg transition hover:bg-fg/5 disabled:opacity-30"
              aria-label={`Decrease stock of ${p.name}`}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center font-display text-xl" aria-live="polite">
              {qty}
            </span>
            <button
              onClick={() => changeQty(1)}
              className="flex h-10 w-10 items-center justify-center text-fg transition hover:bg-fg/5"
              aria-label={`Increase stock of ${p.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              qty === 0 ? "text-brand-red" : qty <= 2 ? "text-amber-500" : "text-emerald-500"
            }`}
          >
            {qty === 0 ? "Out of stock" : qty <= 2 ? "Low stock" : "In stock"}
          </span>
        </div>

        <div className="flex">
          <button
            onClick={() => onPatch({ is_active: !p.is_active })}
            className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-fg"
            aria-label={p.is_active ? `Hide ${p.name}` : `Show ${p.name}`}
            title={p.is_active ? "Hide from website" : "Show on website"}
          >
            {p.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button onClick={onEdit} className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-fg" aria-label={`Edit ${p.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="flex h-10 w-10 items-center justify-center text-brand-muted hover:text-brand-red" aria-label={`Delete ${p.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {!p.is_active && (
        <span className="self-start bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black sm:hidden">Hidden</span>
      )}
    </li>
  );
}
