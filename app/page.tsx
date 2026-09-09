import Link from "next/link";
import Header from "./Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ==========================================
          HEADER
      ========================================== */}

      <Header />

      {/* ==========================================
          HERO
      ========================================== */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-gray-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-28">

          <div className="max-w-4xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-5 py-2.5 rounded-full font-bold text-sm sm:text-base mb-6">
              🚛 Türkiye'nin Yeni Nesil Taşımacılık Platformu
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-tight tracking-tight">

              Yükünü Paylaş,

              <br />

              <span className="text-blue-700">
                En Uygun Teklifi Bul
              </span>

            </h1>

            <p className="max-w-3xl mx-auto mt-6 sm:mt-8 text-lg sm:text-xl text-gray-600 leading-relaxed">

              Yük ilanı oluştur, boş aracını yayınla,
              taşıma tekliflerini karşılaştır ve anlaşmanı
              tek platform üzerinden yönet.

            </p>

            {/* ANA BUTONLAR */}

            <div className="mt-9 sm:mt-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">

              <Link
                href="/yuk-ver"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition"
              >
                📦 Yük İlanı Ver
              </Link>

              <Link
                href="/bos-arac"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition"
              >
                🚛 Boş Araç Ver
              </Link>

              <Link
                href="/ilanlar"
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-2xl font-extrabold text-base sm:text-lg shadow-lg hover:shadow-xl transition"
              >
                🔎 Yük Bul
              </Link>

              <Link
                href="/bos-arac"
                className="bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-900 px-6 py-4 rounded-2xl font-extrabold text-base sm:text-lg shadow-sm hover:shadow-lg transition"
              >
                🚚 Boş Araç Bul
              </Link>

            </div>

          </div>

          {/* HERO ALT BİLGİ */}

          <div className="max-w-5xl mx-auto mt-14 sm:mt-16">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-3xl p-5 text-center shadow-sm">

                <div className="text-3xl mb-2">
                  ⚡
                </div>

                <p className="font-extrabold text-gray-900">
                  Hızlı İlan
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Dakikalar içinde ilanını yayınla.
                </p>

              </div>

              <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-3xl p-5 text-center shadow-sm">

                <div className="text-3xl mb-2">
                  💰
                </div>

                <p className="font-extrabold text-gray-900">
                  Teklif Karşılaştır
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Gelen fiyatları tek ekrandan değerlendir.
                </p>

              </div>

              <div className="bg-white/90 backdrop-blur border border-gray-100 rounded-3xl p-5 text-center shadow-sm">

                <div className="text-3xl mb-2">
                  🤝
                </div>

                <p className="font-extrabold text-gray-900">
                  Kolayca Anlaş
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Teklifi kabul et ve taşımanı takip et.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          HIZLI İŞLEMLER
      ========================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">

        <div className="text-center mb-9">

          <p className="text-blue-600 font-extrabold">
            HIZLI ERİŞİM
          </p>

          <h2 className="text-3xl sm:text-4xl font-black mt-2">
            Ne yapmak istiyorsun?
          </h2>

          <p className="text-gray-500 mt-3">
            Tüm işlemlerine ana sayfadan hızlıca ulaş.
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <Link
            href="/yuk-ver"
            className="group bg-white border border-gray-100 rounded-3xl shadow-md p-7 hover:shadow-xl hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition">
              📦
            </div>

            <h3 className="text-xl font-extrabold">
              Yük İlanı Ver
            </h3>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Taşınacak yükünü yayınla ve teklifleri bekle.
            </p>

            <p className="text-blue-600 font-bold mt-5">
              İlan oluştur →
            </p>

          </Link>

          <Link
            href="/bos-arac"
            className="group bg-white border border-gray-100 rounded-3xl shadow-md p-7 hover:shadow-xl hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition">
              🚛
            </div>

            <h3 className="text-xl font-extrabold">
              Boş Araç Ver
            </h3>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Boş aracının rotasını paylaş ve yük bul.
            </p>

            <p className="text-green-600 font-bold mt-5">
              Araç yayınla →
            </p>

          </Link>

          <Link
            href="/ilanlar"
            className="group bg-white border border-gray-100 rounded-3xl shadow-md p-7 hover:shadow-xl hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition">
              🔎
            </div>

            <h3 className="text-xl font-extrabold">
              Yük Bul
            </h3>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Açık yük ilanlarını incele ve teklif gönder.
            </p>

            <p className="text-purple-600 font-bold mt-5">
              İlanları incele →
            </p>

          </Link>

          <Link
            href="/bos-arac"
            className="group bg-white border border-gray-100 rounded-3xl shadow-md p-7 hover:shadow-xl hover:-translate-y-1 transition"
          >

            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition">
              🚚
            </div>

            <h3 className="text-xl font-extrabold">
              Boş Araç Bul
            </h3>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Rotana uygun boş araç ilanlarını görüntüle.
            </p>

            <p className="text-orange-600 font-bold mt-5">
              Araçları görüntüle →
            </p>

          </Link>

        </div>

      </section>

      {/* ==========================================
          HESABIM
      ========================================== */}

      <section className="bg-gray-900">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">

          <div className="text-center mb-10">

            <p className="text-blue-400 font-extrabold">
              HESABIM
            </p>

            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              Tüm taşıma sürecini tek yerden yönet
            </h2>

            <p className="text-gray-400 mt-3">
              İlanlarını, tekliflerini ve anlaşmalarını kolayca takip et.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            <Link
              href="/benim-ilanlarim"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-3xl p-6 transition"
            >

              <div className="text-4xl mb-4">
                📋
              </div>

              <h3 className="text-xl font-extrabold text-white">
                Benim İlanlarım
              </h3>

              <p className="text-gray-400 mt-2">
                Yayınladığın yük ilanlarını yönet.
              </p>

            </Link>

            <Link
              href="/tekliflerim"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-3xl p-6 transition"
            >

              <div className="text-4xl mb-4">
                💰
              </div>

              <h3 className="text-xl font-extrabold text-white">
                Tekliflerim
              </h3>

              <p className="text-gray-400 mt-2">
                Gönderdiğin tekliflerin durumunu takip et.
              </p>

            </Link>

            <Link
              href="/gelen-teklifler"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-3xl p-6 transition"
            >

              <div className="text-4xl mb-4">
                📥
              </div>

              <h3 className="text-xl font-extrabold text-white">
                Gelen Teklifler
              </h3>

              <p className="text-gray-400 mt-2">
                İlanlarına gelen fiyat tekliflerini yönet.
              </p>

            </Link>

            <Link
              href="/anlasmalarim"
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-3xl p-6 transition"
            >

              <div className="text-4xl mb-4">
                🤝
              </div>

              <h3 className="text-xl font-extrabold text-white">
                Anlaşmalarım
              </h3>

              <p className="text-gray-400 mt-2">
                Kabul edilen taşımalarını ve teslimatı takip et.
              </p>

            </Link>

          </div>

        </div>

      </section>

      {/* ==========================================
          NASIL ÇALIŞIR
      ========================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

        <div className="text-center mb-12">

          <p className="text-green-600 font-extrabold">
            NASIL ÇALIŞIR?
          </p>

          <h2 className="text-3xl sm:text-4xl font-black mt-2">
            3 adımda taşımanı yönet
          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 p-8">

            <div className="absolute -top-4 left-6 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black">
              1
            </div>

            <div className="text-5xl mt-3 mb-5">
              📦
            </div>

            <h3 className="text-xl font-extrabold">
              İlanını Yayınla
            </h3>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Yükünü veya boş aracını birkaç bilgi girerek kolayca yayınla.
            </p>

          </div>

          <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 p-8">

            <div className="absolute -top-4 left-6 bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black">
              2
            </div>

            <div className="text-5xl mt-3 mb-5">
              💰
            </div>

            <h3 className="text-xl font-extrabold">
              Teklifleri Değerlendir
            </h3>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Gelen teklifleri incele, fiyatları karşılaştır ve uygun olanı seç.
            </p>

          </div>

          <div className="relative bg-white rounded-3xl shadow-md border border-gray-100 p-8">

            <div className="absolute -top-4 left-6 bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black">
              3
            </div>

            <div className="text-5xl mt-3 mb-5">
              🤝
            </div>

            <h3 className="text-xl font-extrabold">
              Anlaş ve Taşımayı Tamamla
            </h3>

            <p className="text-gray-500 mt-3 leading-relaxed">
              Teklifi kabul et, sohbet et, teslimatı onayla ve işlemi tamamla.
            </p>

          </div>

        </div>

      </section>

      {/* ==========================================
          NEDEN YÜKLİN?
      ========================================== */}

      <section className="bg-blue-50 border-y border-blue-100">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            <div>

              <p className="text-blue-700 font-extrabold">
                NEDEN YÜKLİN?
              </p>

              <h2 className="text-3xl sm:text-4xl font-black mt-3 leading-tight">
                Taşımacılığı daha hızlı ve daha kolay hale getiriyoruz.
              </h2>

              <p className="text-gray-600 mt-5 text-lg leading-relaxed">
                YÜKLİN; yük ilanı, boş araç, teklif, anlaşma,
                sohbet ve teslimat süreçlerini tek platformda
                bir araya getirir.
              </p>

            </div>

            <div className="grid sm:grid-cols-2 gap-4">

              <div className="bg-white rounded-3xl p-6 shadow-sm">

                <div className="text-3xl mb-3">
                  📱
                </div>

                <h3 className="font-extrabold text-lg">
                  Kolay Kullanım
                </h3>

                <p className="text-gray-500 mt-2">
                  Karmaşık işlemler olmadan ilanını oluştur.
                </p>

              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">

                <div className="text-3xl mb-3">
                  🔔
                </div>

                <h3 className="font-extrabold text-lg">
                  Bildirimler
                </h3>

                <p className="text-gray-500 mt-2">
                  Yeni teklif ve anlaşma gelişmelerini takip et.
                </p>

              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">

                <div className="text-3xl mb-3">
                  💬
                </div>

                <h3 className="font-extrabold text-lg">
                  Doğrudan Sohbet
                </h3>

                <p className="text-gray-500 mt-2">
                  Anlaşma sonrası karşı tarafla iletişim kur.
                </p>

              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm">

                <div className="text-3xl mb-3">
                  ⭐
                </div>

                <h3 className="font-extrabold text-lg">
                  Değerlendirme
                </h3>

                <p className="text-gray-500 mt-2">
                  Tamamlanan taşımalardan sonra deneyimini paylaş.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          HAKKIMIZDA
      ========================================== */}

      <section
        id="hakkimizda"
        className="bg-white"
      >

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">

          <div className="text-5xl mb-5">
            🚛
          </div>

          <h2 className="text-3xl sm:text-4xl font-black">
            YÜKLİN Nedir?
          </h2>

          <p className="max-w-3xl mx-auto mt-5 text-gray-600 text-base sm:text-lg leading-relaxed">
            YÜKLİN, yük ve taşımacılık ihtiyacı olan kullanıcıları
            aynı platformda buluşturan yeni nesil bir taşıma
            platformudur. Kullanıcılar yük ilanı yayınlayabilir,
            boş araç paylaşabilir, teklif gönderebilir ve
            anlaşmalarını tek yerden yönetebilir.
          </p>

        </div>

      </section>

      {/* ==========================================
          CTA
      ========================================== */}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">

        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl">

          <div className="text-5xl mb-4">
            🚀
          </div>

          <h2 className="text-3xl sm:text-4xl font-black">
            Taşımaya hemen başla
          </h2>

          <p className="text-blue-100 mt-4 text-lg max-w-2xl mx-auto">
            İlanını yayınla veya mevcut ilanları inceleyerek
            uygun taşıma fırsatını bul.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">

            <Link
              href="/yuk-ver"
              className="bg-white text-blue-700 hover:bg-blue-50 px-7 py-4 rounded-xl font-extrabold"
            >
              📦 İlan Oluştur
            </Link>

            <Link
              href="/ilanlar"
              className="bg-blue-900/40 hover:bg-blue-900/60 border border-blue-400 text-white px-7 py-4 rounded-xl font-extrabold"
            >
              🔎 İlanları İncele
            </Link>

          </div>

        </div>

      </section>

      {/* ==========================================
          İLETİŞİM
      ========================================== */}

      <section
        id="iletisim"
        className="border-t bg-gray-50"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">

          <h2 className="text-2xl sm:text-3xl font-extrabold">
            İletişim
          </h2>

          <p className="text-gray-500 mt-3">
            YÜKLİN ile ilgili soru ve önerilerin için bizimle iletişime geçebilirsin.
          </p>

        </div>

      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="bg-gray-950 text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-center md:text-left">

            <div>

              <p className="font-black text-2xl">
                🚛 YÜKLİN
              </p>

              <p className="text-gray-400 mt-2">
                Yükünü Paylaş, Teklifleri Karşılaştır, Güvenle Taşıt.
              </p>

            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-5 text-sm font-semibold text-gray-300">

              <Link href="/ilanlar" className="hover:text-white">
                Yük İlanları
              </Link>

              <Link href="/bos-arac" className="hover:text-white">
                Boş Araçlar
              </Link>

              <Link href="/anlasmalarim" className="hover:text-white">
                Anlaşmalarım
              </Link>

              <Link href="/profil" className="hover:text-white">
                Profilim
              </Link>

            </div>

          </div>

          <div className="border-t border-gray-800 mt-8 pt-6">

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">

              <p>
                © 2026 YÜKLİN. Tüm hakları saklıdır.
              </p>

              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">

                <Link
                  href="/kvkk"
                  className="hover:text-white transition"
                >
                  KVKK
                </Link>

                <Link
                  href="/gizlilik"
                  className="hover:text-white transition"
                >
                  Gizlilik Politikası
                </Link>

                <Link
                  href="/kullanim-kosullari"
                  className="hover:text-white transition"
                >
                  Kullanım Koşulları
                </Link>

                <Link
                  href="/cerez-politikasi"
                  className="hover:text-white transition"
                >
                  Çerez Politikası
                </Link>

              </div>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}