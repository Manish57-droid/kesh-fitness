"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Minus, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resizeImage } from "@/lib/image";
import type { Product } from "@/lib/types";

const BUCKET = "products";

/** Storage path from a public URL like …/storage/v1/object/public/products/<path>. */
export const storagePath = (url: string | null) => url?.split(`/object/public/${BUCKET}/`)[1] ?? null;

type Props = {
  product: Product | null; // null = adding a new product
  categories: string[];
  onClose: () => void;
  onSaved: (p: Product) => void;
};

export default function ProductForm({ product, categories, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "",
    price: product?.price?.toString() ?? "",
    mrp: product?.mrp?.toString() ?? "",
    description: product?.description ?? "",
    sort_order: product?.sort_order?.toString() ?? "0",
    quantity: (product?.quantity ?? 1).toString(),
    is_active: product?.is_active ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product?.image_url ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  // Lock background scroll while the form is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    const mrp = form.mrp ? Number(form.mrp) : null;
    if (mrp !== null && mrp < price) return setError("MRP should be equal to or higher than the selling price.");

    setBusy(true);
    setError("");
    const supabase = createClient();
    let image_url = removeImage ? null : product?.image_url ?? null;

    if (file) {
      try {
        const blob = await resizeImage(file);
        const ext = blob.type === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
        if (upErr) throw upErr;
        image_url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      } catch (err) {
        setBusy(false);
        return setError(`Photo upload failed: ${(err as Error).message}`);
      }
    }

    const row = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      price,
      mrp,
      description: form.description.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      quantity: Math.max(0, Math.round(Number(form.quantity) || 0)),
      in_stock: Number(form.quantity) > 0,
      is_active: form.is_active,
      image_url,
    };

    const query = product
      ? supabase.from("products").update(row).eq("id", product.id)
      : supabase.from("products").insert(row);
    const { data, error } = await query.select().single();
    setBusy(false);
    if (error) {
      return setError(
        error.message.includes("quantity")
          ? "Stock quantity needs supabase/migrations/003_product_quantity.sql. Run it in the SQL Editor."
          : error.message
      );
    }

    // Clean up the old photo once the new one is saved.
    const oldPath = storagePath(product?.image_url ?? null);
    if (oldPath && product?.image_url !== image_url) await supabase.storage.from(BUCKET).remove([oldPath]);

    onSaved(data as Product);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92svh] w-full flex-col border border-brand-line bg-brand-card sm:max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3 sm:px-6">
          <h2 className="font-display text-2xl tracking-wide">{product ? "Edit Product" : "Add Product"}</h2>
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-brand-muted hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Photo */}
          <div>
            <p className="label">Photo</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-dashed border-brand-line bg-white text-brand-muted hover:border-brand-red"
              >
                {preview && !removeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-7 w-7" />
                )}
              </button>
              <div className="space-y-2 text-xs text-brand-muted">
                <button type="button" onClick={() => fileInput.current?.click()} className="btn-ghost btn-sm">
                  {preview && !removeImage ? "Change photo" : "Choose photo"}
                </button>
                {preview && !removeImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setRemoveImage(true);
                    }}
                    className="block text-brand-red hover:underline"
                  >
                    Remove photo
                  </button>
                )}
                <p>JPG, PNG or WebP. Resized automatically.</p>
              </div>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setRemoveImage(false);
                  }
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="p-name" className="label">Product name *</label>
            <input id="p-name" className="input" value={form.name} onChange={set("name")} required maxLength={80} placeholder="e.g. Whey Protein 1kg (Chocolate)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-price" className="label">Price (₹) *</label>
              <input id="p-price" type="number" inputMode="numeric" min={0} className="input" value={form.price} onChange={set("price")} required />
            </div>
            <div>
              <label htmlFor="p-mrp" className="label">MRP (₹)</label>
              <input id="p-mrp" type="number" inputMode="numeric" min={0} className="input" value={form.mrp} onChange={set("mrp")} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-cat" className="label">Category</label>
              <input id="p-cat" list="p-cat-list" className="input" value={form.category} onChange={set("category")} maxLength={40} placeholder="e.g. Protein" />
              <datalist id="p-cat-list">
                {Array.from(new Set(["Protein", "Pre-workout", "Vitamins", "Accessories", "Apparel", ...categories])).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="p-sort" className="label">Display order</label>
              <input id="p-sort" type="number" inputMode="numeric" className="input" value={form.sort_order} onChange={set("sort_order")} />
            </div>
          </div>

          <div>
            <label htmlFor="p-desc" className="label">Short description</label>
            <textarea id="p-desc" rows={3} className="input resize-y" value={form.description} onChange={set("description")} maxLength={300} placeholder="Flavour, size, servings…" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="p-qty" className="label">Stock quantity</label>
              <div className="flex items-center border border-brand-line">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, quantity: String(Math.max(0, Number(form.quantity) - 1)) })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-fg/5"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  id="p-qty"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="w-full border-x border-brand-line bg-brand-black py-2.5 text-center text-base outline-none sm:text-sm"
                  value={form.quantity}
                  onChange={set("quantity")}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, quantity: String(Number(form.quantity) + 1) })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center hover:bg-fg/5"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-brand-muted">0 shows “Out of stock” on the website.</p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 self-start border border-brand-line p-3 sm:mt-6">
              <input type="checkbox" checked={form.is_active} onChange={set("is_active")} className="mt-0.5 h-5 w-5 accent-[#E11D2A]" />
              <span>
                <span className="block text-sm font-semibold">Show on website</span>
                <span className="block text-xs text-brand-muted">Uncheck to hide it</span>
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-brand-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary flex-1">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
