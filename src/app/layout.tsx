import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/components/providers/trpc-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Service Center Management",
    template: "%s | Service Center",
  },
  description:
    "Hệ thống quản lý trung tâm bảo hành và sửa chữa - Quản lý phiếu bảo hành, khách hàng, linh kiện và sản phẩm",
  keywords: [
    "service center",
    "warranty management",
    "repair management",
    "customer management",
    "trung tâm bảo hành",
  ],
  authors: [{ name: "Service Center Team" }],
  creator: "Service Center Team",
  publisher: "Service Center Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
