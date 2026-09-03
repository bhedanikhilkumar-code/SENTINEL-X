import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "SPECTER-TRACE // NTRO Threat Actor Attribution Workbench",
  description:
    "National Cyber Threat Actor Attribution & Forensic Intelligence Workbench (SIH26151 - NTRO)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#070a13] text-slate-200 antialiased selection:bg-cyan-500 selection:text-black min-h-screen overflow-x-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
