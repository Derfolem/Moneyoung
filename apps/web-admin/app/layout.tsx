import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MoneYoung Admin",
  description: "Painel administrativo MoneYoung"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
