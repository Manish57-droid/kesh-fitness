import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DumbbellArt from "@/components/DumbbellArt";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 text-center">
      <DumbbellArt className="w-56 text-brand-red/30" />
      <p className="mt-6 font-display text-7xl leading-none text-brand-red">404</p>
      <h1 className="mt-2 font-display text-3xl tracking-wide">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-fg/70">This page doesn&apos;t exist or has moved.</p>
      <Link href="/" className="btn-primary mt-8">
        <ArrowLeft className="h-4 w-4" /> Back to Kesh Fitness
      </Link>
    </main>
  );
}
