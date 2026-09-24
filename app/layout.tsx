import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://yuklin.com.tr"),

  title: {
    default: "YÜKLİN | Yükünü Paylaş, En Uygun Teklifi Bul",
    template: "%s | YÜKLİN",
  },

  description:
    "YÜKLİN ile yük ilanı oluştur, boş araçları bul, nakliye tekliflerini karşılaştır ve taşımacılığını kolayca yönet.",

  keywords: [
    "yük taşıma",
    "nakliye",
    "yük ilanı",
    "boş araç",
    "nakliyeci",
    "yük bul",
    "kamyon yükü",
    "Türkiye nakliye",
    "YÜKLİN",
  ],

  alternates: {
    canonical: "https://yuklin.com.tr",
  },

  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },

  openGraph: {
    title: "YÜKLİN | Yükünü Paylaş, En Uygun Teklifi Bul",
    description:
      "Yük ilanı oluştur, boş araçları bul ve nakliye tekliflerini karşılaştır.",
    url: "https://yuklin.com.tr",
    siteName: "YÜKLİN",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/yuklin-logo.png",
        width: 1200,
        height: 630,
        alt: "YÜKLİN - Yük ve Taşımacılık Platformu",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "YÜKLİN | Yükünü Paylaş, En Uygun Teklifi Bul",
    description:
      "Yük ilanı oluştur, boş araçları bul ve nakliye tekliflerini karşılaştır.",
    images: ["/yuklin-logo.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
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