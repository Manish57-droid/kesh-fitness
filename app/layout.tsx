import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Kesh Fitness – Unisex Multi Gym near Silli Stadium",
  description:
    "Kesh Fitness is a unisex multi gym near Silli Stadium. Strength training, fat loss, muscle gain and personal guidance from Team Invincible Kesh.",
};

// Applies the saved theme before first paint to avoid a flash. Dark is the default.
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
