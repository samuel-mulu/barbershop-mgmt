import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbershop Pro - Professional Management System",
  description: "Modern barbershop management system for owners, admins, and staff. Manage services, appointments, and operations efficiently.",
  keywords: ["barbershop", "management", "appointments", "services", "staff"],
  authors: [{ name: "Barbershop Pro Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/next.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Barbershop Pro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-violet-200 selection:text-violet-900">
        {children}
      </body>
    </html>
  );
}
