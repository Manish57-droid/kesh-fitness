import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import JoinStatusView from "@/components/shop/JoinStatusView";
import { getContent } from "@/lib/content-server";

export const metadata: Metadata = { title: "Membership – Kesh Fitness", robots: { index: false } };

export default async function JoinStatusPage({ params }: { params: { token: string } }) {
  const c = await getContent();
  return (
    <>
      <Navbar solid />
      <main className="container-x pb-16 pt-24 md:pt-32 print:p-0">
        <JoinStatusView token={params.token} gym={c.gym} plans={c.plans.items} />
      </main>
    </>
  );
}
