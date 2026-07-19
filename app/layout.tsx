// The shared page wrapper: sets up fonts, dark/light mode, and the nav bar
// that shows on every page.
import type { Metadata } from "next";
import { Fraunces, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "next-themes";

// Display face for headings and hero moments - a serif with real
// character, distinct from the body face, used with restraint.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"], // italic carries the editorial register on section headings
});

// Body face - clean and legible for long reading (notes, questions).
const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Mono face for stats, mastery percentages, and other numeric data.
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NoteFlow",
  description: "Organise notes, track quiz performance, get adaptive practice",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavBar />
          {/* Sidebar renders null when logged out, so this row is a
              no-op on /login and /signup - same self-check pattern
              NavBar already uses. */}
          <div className="flex flex-1">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}