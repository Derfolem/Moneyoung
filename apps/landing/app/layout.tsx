import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "MoneYoung",
  description: "MoneYoung — banco educacional para escolas"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, backgroundColor: "#000000" }}>{children}</body>
    </html>
  );
}
