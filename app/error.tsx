"use client";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

/** Shown instead of a blank page if something on a page fails to load. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center px-4 pb-16 text-center">
      <h1 className="font-display text-4xl tracking-wide">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-fg/70">Please check your internet connection and try again.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="btn-ghost">
          Home
        </Link>
      </div>
    </main>
  );
}
