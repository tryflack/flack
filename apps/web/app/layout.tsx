import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@flack/ui/components/sonner";
import { Provider } from "react-wrap-balancer";
import { ThemeProvider } from "./components/theme-provider"
import "@flack/ui/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flack - Modern Open Source Slack Alternative",
  description: "Flack - Modern Open Source Slack Alternative",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-full flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange>
          <Provider>
            <main>
              {children}
            </main>
          </Provider>
        </ThemeProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}

