import type { Metadata } from "next";
import { Familjen_Grotesk, IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const display = Familjen_Grotesk({ variable: "--nf-display", subsets: ["latin"] });
const body = Public_Sans({ variable: "--nf-body", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--nf-data", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Campaign Planner",
  description: "Publisher matching, persona creative, and campaign config, with the reasoning shown",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
