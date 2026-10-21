import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { TabBar } from "@/components/TabBar";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

export const metadata: Metadata = {
  title: { default: "Crema", template: "%s | Crema" },
  description: "Search any coffee and get Meraki Gen 2 settings, flavour notes and drink recipes.",
  appleWebApp: { capable: true, title: "Crema", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} antialiased`}>
      <body className="min-h-dvh">
        <div className="lg:pl-60">
          <div className="mx-auto min-h-dvh max-w-xl pb-tabbar pt-[env(safe-area-inset-top)] lg:max-w-6xl lg:pb-20">
            {children}
          </div>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
