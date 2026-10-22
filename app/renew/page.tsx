import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RenewForm from "@/components/features/RenewForm";

export const metadata: Metadata = { title: "Renew membership – Kesh Fitness" };

export default function RenewPage() {
  return (
    <>
      <Navbar solid />
      <main className="container-x pb-16 pt-24 md:pt-32">
        <p className="eyebrow">Members</p>
        <h1 className="heading mb-8 mt-4">
          Renew <span className="text-brand-red">Monthly Fee</span>
        </h1>
        <RenewForm />
      </main>
    </>
  );
}
