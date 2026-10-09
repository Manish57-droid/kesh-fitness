import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Admin Login – Kesh Fitness", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <>
      <Navbar solid />
      <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 pb-12 pt-24">
        <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand-red/15 blur-[120px]" />
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
