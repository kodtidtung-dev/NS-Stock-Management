import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NS Stock Management",
  description: "ระบบจัดการสต็อก",
  icons: {
    icon: [
      { url: "/ns.logowhite.png", sizes: "16x16" },
      { url: "/ns.logowhite.png", sizes: "32x32" },
      { url: "/ns.logowhite.png", sizes: "48x48" },
    ],
    shortcut: "/ns.logowhite.png",
    apple: [
      { url: "/ns.logowhite.png", sizes: "180x180" },
      { url: "/ns.logowhite.png", sizes: "152x152" },
      { url: "/ns.logowhite.png", sizes: "120x120" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          theme="dark"
        />
      </body>
    </html>
  );
}
