import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ReceiptView from "@/components/shop/ReceiptView";
import { getContent } from "@/lib/content-server";

export const metadata: Metadata = { title: "Receipt – Kesh Fitness", robots: { index: false } };

export default async function ReceiptPage({ params }: { params: { token: string } }) {
  const c = await getContent();
  return (
    <>
      <Navbar solid />
      <main className="container-x pb-16 pt-24 md:pt-32 print:p-0">
        <ReceiptView token={params.token} gym={c.gym} />
      </main>
    </>
  );
}
