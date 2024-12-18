import type { Metadata } from "next";
import localFont from "next/font/local";
import { Open_Sans } from 'next/font/google';
import "./globals.css";

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
const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '700'], // Customize weights
});

export const metadata: Metadata = {
  title: "Automail-v1",
  description: "Beta version of Automail",
  icons: {
    icon: '/favicon.png', // Path to your favicon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        className={`${openSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
