import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kesh Fitness – Unisex Multi Gym near Silli Stadium",
  description:
    "Kesh Fitness is a unisex multi gym near Silli Stadium. Strength training, fat loss, muscle gain and personal guidance from Team Invincible Kesh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
