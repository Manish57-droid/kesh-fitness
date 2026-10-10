import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Checkout from "@/components/shop/Checkout";

export const metadata: Metadata = { title: "Checkout – Kesh Fitness", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <Navbar solid />
      <main className="container-x pb-16 pt-24 md:pt-32">
        <p className="eyebrow">Checkout</p>
        <h1 className="heading mb-8 mt-4">
          Your <span className="text-brand-red">Order</span>
        </h1>
        <Suspense fallback={<div className="mx-auto h-96 max-w-4xl animate-pulse bg-brand-card" />}>
          <Checkout />
        </Suspense>
      </main>
    </>
  );
}
