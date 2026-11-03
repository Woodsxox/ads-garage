import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import Script from "next/script";
import { AdSenseLoader } from "@/components/ads/AdSenseLoader";
import { Loader } from "@/components/chrome/Loader";
import { PageTransitionProvider } from "@/components/chrome/PageTransition";
import { PillNav } from "@/components/chrome/PillNav";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ads Garage",
    template: "%s — Ads Garage",
  },
  description:
    "Discover how digital ads work, learn them in a safe sandbox, create your own, then export or publish them. Free to browse; supported by clearly labelled ads and subscriptions.",
};

/**
 * Marks the first visit of a browser session so the loader can show once, without a flash of the
 * page first. The loader itself is hidden by CSS unless this ran. It goes through next/script with
 * `beforeInteractive`, which Next injects into the head before hydration.
 *
 * Known and harmless: in development React logs "Encountered a script tag while rendering React
 * component" when a page calls notFound() (for example an ad id that does not exist), because the
 * layout is re-rendered on the client there. The script has already run from the server HTML by
 * then. Any inline script in the root layout does this; React only emits it in development.
 */
const LOADER_FLAG = `try{document.documentElement.dataset.loader=sessionStorage.getItem("ag-loaded")?"off":"on"}catch(e){document.documentElement.dataset.loader="off"}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the script below sets data-loader on <html> before React hydrates.
    <html lang="en" className={`${interTight.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-bay-floor font-body text-chalk antialiased">
        <Script id="loader-flag" strategy="beforeInteractive">
          {LOADER_FLAG}
        </Script>
        <PageTransitionProvider>
          <AdSenseLoader />
          <SmoothScroll />
          <Loader />
          <SiteHeader />
          <main id="main" className="flex-1 pt-20">
            {children}
          </main>
          <SiteFooter />
          <PillNav />
        </PageTransitionProvider>
      </body>
    </html>
  );
}
