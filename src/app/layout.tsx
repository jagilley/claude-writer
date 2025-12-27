import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Writer - AI-Assisted Creative Writing",
  description: "An AI-maximalist text editor for creative writing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
