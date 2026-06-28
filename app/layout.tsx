import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kesh Fitness – Elevate Your Strength",
  description:
    "Kesh Fitness offers premium gym facilities, world-class equipment, expert trainers, and multiple branches across the city. Join us and transform your life.",
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
