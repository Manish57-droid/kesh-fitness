import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Shop from "@/components/features/Shop";
import MyOrders from "@/components/shop/MyOrders";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Shop – Kesh Fitness",
  description: "Supplements and gym gear from Kesh Fitness. Order online, pay by UPI or cash, collect at the gym.",
};

export default function ShopPage() {
  return (
    <>
      <Navbar solid />
      <main>
        <Shop />
        <MyOrders />
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
