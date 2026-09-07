import "./globals.css";

export const metadata = {
  title: "YÜKLİN",
  description: "Türkiye'nin Akıllı Yük Taşıma Platformu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}