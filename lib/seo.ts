import type { Metadata } from "next";

// Search and link-preview text. Pages that set their own openGraph must spread `openGraph`,
// because Next.js replaces (doesn't merge) a parent's openGraph.
export const title = "Kesh Fitness – Unisex Multi Gym near Silli Stadium";
export const description =
  "Kesh Fitness is a unisex multi gym near Silli Stadium. Strength training, fat loss, muscle gain and personal guidance from Team Invincible Kesh.";

export const openGraph: NonNullable<Metadata["openGraph"]> = {
  type: "website",
  siteName: "Kesh Fitness",
  locale: "en_IN",
  title,
  description,
  images: [{ url: "/images/hero.jpg", alt: "Kesh Fitness gym" }],
};
