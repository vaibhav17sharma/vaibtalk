import { Appbar } from "@/components/common/AppBar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import "@/style/globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "vaibtalk",
  description: "A peer to peer all in one solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          geistMono.variable,
          geistSans.variable
        )}
      >
        <Providers>
          <div>
            <Appbar />
            {children}
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}

