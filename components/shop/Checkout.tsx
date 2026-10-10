"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Banknote, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import Photo from "../Photo";
import QuantityStepper from "./QuantityStepper";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { payment, rupees } from "@/lib/site";
import type { PaymentMethod, Product } from "@/lib/types";

const MAX_PER_ORDER = 20;

export type SavedOrder = { token: string; receiptNo: string };

export default function Checkout() {
  const router = useRouter();
  const productId = Number(useSearchParams().get("product"));
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = readJSON<{ name?: string; phone?: string }>(KEYS.customer, {});
    setName(saved.name ?? "");
    setPhone(saved.phone ?? "");
    if (!isSupabaseConfigured || !productId) return setProduct(null);
    createClient()
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => setProduct((data as Product | null) ?? null));
  }, [productId]);

  if (product === undefined) {
    return <div className="mx-auto h-96 max-w-4xl animate-pulse bg-brand-card" />;
  }

  if (!product) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-display text-3xl tracking-wide">
          Product not found
        </p>
        <p className="mt-2 text-sm text-fg/70">This product isn&apos;t available right now.</p>
        <Link href="/shop" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    );
  }

  const max = MAX_PER_ORDER;
  const subtotal = product.price * qty;
  const total = subtotal + payment.serviceCharge;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    writeJSON(KEYS.customer, { name: name.trim(), phone: phone.trim() });

    const { data, error } = await createClient()
      .rpc("place_order", {
        p_product_id: product.id,
        p_quantity: qty,
        p_method: method,
        p_name: name,
        p_phone: phone,
      })
      .single<{ receipt_no: string; token: string }>();

    if (error || !data) {
      setBusy(false);
      // place_order's own errors are written for customers (e.g. "Please enter your name.");
      // PGRST202 means the ordering functions aren't installed yet.
      return setError(
        error?.code === "PGRST202"
          ? "Online ordering isn't available yet. Please order at the gym counter."
          : error?.message ?? "Couldn't place the order. Please try again."
      );
    }

    const orders = readJSON<SavedOrder[]>(KEYS.orders, []);
    writeJSON(KEYS.orders, [{ token: data.token, receiptNo: data.receipt_no }, ...orders].slice(0, 30));
    router.push(`/receipt/${data.token}`);
  };

  const methodOption = (id: PaymentMethod, label: string, hint: string, Icon: typeof Smartphone) => (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-4 transition ${
        method === id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"
      }`}
    >
      <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="sr-only" />
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          method === id ? "border-brand-red" : "border-brand-line"
        }`}
      >
        {method === id && <span className="h-2.5 w-2.5 rounded-full bg-brand-red" />}
      </span>
      <span>
        <span className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-brand-red" /> {label}
        </span>
        <span className="mt-0.5 block text-xs text-brand-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <form onSubmit={placeOrder} className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        {/* Product */}
        <div className="card flex gap-4 p-4 sm:p-5">
          <Photo src={product.image_url ?? ""} alt={product.name} className="h-24 w-24 shrink-0 bg-white sm:h-28 sm:w-28" />
          <div className="min-w-0">
            {product.category && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-red">{product.category}</p>
            )}
            <h1 className="mt-1 text-lg font-semibold leading-snug">{product.name}</h1>
            {product.description && <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{product.description}</p>}
            <p className="mt-2 font-display text-3xl leading-none">{rupees(product.price)}</p>
          </div>
        </div>

        {/* Quantity */}
        <div className="card p-4 sm:p-5">
          <p className="label">Quantity</p>
          <div className="flex flex-wrap items-center gap-4">
            <QuantityStepper value={qty} max={max} onChange={setQty} />
            <span className="text-xs text-brand-muted">
              Max {max} per order
            </span>
          </div>
        </div>

        {/* Customer */}
        <div className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          <div>
            <label htmlFor="c-name" className="label">Your name *</label>
            <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="c-phone" className="label">Phone *</label>
            <input
              id="c-phone"
              type="tel"
              inputMode="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              pattern="[0-9+\s\-]{10,15}"
              title="Enter a valid phone number"
              maxLength={15}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Payment method */}
        <div className="card p-4 sm:p-5">
          <p className="label">How will you pay?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {methodOption("upi", "Pay online", "UPI: Paytm, PhonePe, GPay, BHIM", Smartphone)}
            {methodOption("cash", "Cash at gym", "Pay at the counter. Staff confirm it.", Banknote)}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-4 sm:p-6">
          <p className="font-display text-2xl tracking-wide">Order Summary</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg/70">
                {rupees(product.price)} × {qty}
              </dt>
              <dd>{rupees(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg/70">Service charge</dt>
              <dd>{rupees(payment.serviceCharge)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-brand-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-4xl leading-none">{rupees(total)}</dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {method === "upi" ? `Continue to pay ${rupees(total)}` : "Place order (pay cash)"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> You get a receipt with a unique ID on the next screen.
          </p>
        </div>
        <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    </form>
  );
}
