import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Shop from "@/components/features/Shop";
import MyOrders from "@/components/shop/MyOrders";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import { getContent } from "@/lib/content-server";

export const metadata: Metadata = {
  title: "Shop – Kesh Fitness",
  description: "Supplements and gym gear from Kesh Fitness. Order online, pay by UPI or cash, collect at the gym.",
};

export const revalidate = 600;

export default async function ShopPage() {
  const c = await getContent();
  return (
    <>
      <Navbar solid />
      <main>
        <Shop />
        <MyOrders />
      </main>
      <Footer gym={c.gym} />
      <MobileNav />
    </>
  );
}
