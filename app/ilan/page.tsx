"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { useParams, useRouter } from "next/navigation";

import { auth, db } from "../firebase";

export default function IlanDetayPage() {
  const params = useParams();
  const router = useRouter();

  const ilanId = String(params?.id || "");

  const [ilan, setIlan] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const [teklifFiyati, setTeklifFiyati] = useState("");
  const [paraBirimi, setParaBirimi] = useState("TRY");
  const [mesaj, setMesaj] = useState("");

  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [paylasimMesaji, setPaylasimMesaji] = useState("");

  // ==========================================
  // İLAN + KULLANICI
  // ==========================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);

      if (user) {
        setUserId(user.uid);
      } else {
        setUserId("");
      }

      try {
        if (!ilanId) {
          setHata("İlan bilgisi bulunamadı.");
          setLoading(false);
          return;
        }

        const ilanSnap = await getDoc(doc(db, "yukler", ilanId));

        if (!ilanSnap.exists()) {
          setIlan(null);
          setHata("Bu ilan bulunamadı.");
          setLoading(false);
          return;
        }

        const data: any = {
          id: ilanSnap.id,
          ...ilanSnap.data(),
        };

        setIlan(data);
        setParaBirimi(data.paraBirimi || "TRY");
        setHata("");
      } catch {
        setIlan(null);
        setHata("İlan yüklenirken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [ilanId]);

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster() {
    const sembol =
      ilan?.paraBirimi === "USD"
        ? "$"
        : ilan?.paraBirimi === "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      ilan?.fiyat || 0
    ).toLocaleString("tr-TR")}`;
  }

  // ==========================================
  // PAYLAŞIM LİNKİ
  // ==========================================

  function ilanLinkiOlustur() {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/ilan/${ilanId}`;
    }

    return `https://yuklin.com.tr/ilan/${ilanId}`;
  }

  // ==========================================
  // PAYLAŞIM METNİ
  // ==========================================

  function paylasimMetniOlustur() {
    if (!ilan) {
      return "";
    }

    const sembol =
      ilan?.paraBirimi === "USD"
        ? "$"
        : ilan?.paraBirimi === "EUR"
        ? "€"
        : "₺";

    const fiyat = `${sembol}${Number(
      ilan?.fiyat || 0
    ).toLocaleString("tr-TR")}`;

    return `🚛 YÜKLİN'de Yük İlanı

📍 ${ilan.nereden || "-"} → ${ilan.nereye || "-"}
📦 ${ilan.yukTuru || "-"}
⚖️ ${ilan.agirlik || "-"}
💰 ${fiyat}

İlanı incele:
${ilanLinkiOlustur()}`;
  }

  // ==========================================
  // WHATSAPP
  // ==========================================

  function whatsAppPaylas() {
    const metin = encodeURIComponent(paylasimMetniOlustur());

    window.open(
      `https://wa.me/?text=${metin}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ==========================================
  // FACEBOOK
  // ==========================================

  function facebookPaylas() {
    const link = encodeURIComponent(ilanLinkiOlustur());

    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ==========================================
  // X
  // ==========================================

  function xPaylas() {
    const metin = encodeURIComponent(
      `🚛 YÜKLİN'de Yük İlanı

📍 ${ilan?.nereden || "-"} → ${ilan?.nereye || "-"}
📦 ${ilan?.yukTuru || "-"}`
    );

    const link = encodeURIComponent(ilanLinkiOlustur());

    window.open(
      `https://twitter.com/intent/tweet?text=${metin}&url=${link}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ==========================================
  // BAĞLANTIYI KOPYALA
  // ==========================================

  async function baglantiyiKopyala() {
    try {
      await navigator.clipboard.writeText(ilanLinkiOlustur());

      setPaylasimMesaji("✅ Bağlantı kopyalandı!");

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 2500);
    } catch {
      setPaylasimMesaji("Bağlantı kopyalanamadı.");

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 2500);
    }
  }

  // ==========================================
  // TELEFON / INSTAGRAM
  // ==========================================

  async function cihazdanPaylas() {
    const link = ilanLinkiOlustur();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `YÜKLİN | ${ilan?.nereden || ""} → ${
            ilan?.nereye || ""
          }`,
          text: paylasimMetniOlustur(),
          url: link,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setPaylasimMesaji("Paylaşım açılamadı.");

          window.setTimeout(() => {
            setPaylasimMesaji("");
          }, 2500);
        }
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(paylasimMetniOlustur());

      setPaylasimMesaji(
        "📋 Paylaşım metni kopyalandı. Instagram'a yapıştırabilirsin."
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 3500);
    } catch {
      setPaylasimMesaji(
        "Paylaşım özelliği bu cihazda desteklenmiyor."
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 3000);
    }
  }

  // ==========================================
  // BİLDİRİM
  // ==========================================

  async function yeniTeklifBildirimi(ilanData: any) {
    const ilanSahibiId = String(ilanData?.userId || "");

    if (!ilanSahibiId) {
      return;
    }

    try {
      await addDoc(collection(db, "bildirimler"), {
        kullaniciId: ilanSahibiId,

        baslik: "💰 Yeni Teklif Geldi",

        mesaj: `${ilanData.nereden || "Yük"} → ${
          ilanData.nereye || ""
        } ilanına yeni bir taşıma teklifi geldi.`,

        tip: "yeni_teklif",

        hedef: "/gelen-teklifler",

        okundu: false,

        createdAt: serverTimestamp(),
      });
    } catch {
      // Bildirim hatası teklif işlemini bozmasın.
    }
  }

  // ==========================================
  // TEKLİF GÖNDER
  // ==========================================

  async function teklifGonder() {
    setHata("");
    setBasari("");

    if (!ilan) {
      setHata("İlan bulunamadı.");
      return;
    }

    if (!userId) {
      router.push("/login");
      return;
    }

    if (ilan.userId === userId) {
      setHata("Kendi ilanına teklif veremezsin.");
      return;
    }

    if (ilan.durum !== "Açık") {
      setHata("Bu ilan artık teklif almıyor.");
      return;
    }

    if (teklifFiyati.trim() === "") {
      setHata("Lütfen teklif fiyatını gir.");
      return;
    }

    const fiyat = Number(teklifFiyati);

    if (Number.isNaN(fiyat) || fiyat <= 0) {
      setHata("Geçerli bir teklif fiyatı gir.");
      return;
    }

    try {
      setGonderiliyor(true);

      const guncelIlanSnap = await getDoc(
        doc(db, "yukler", ilan.id)
      );

      if (!guncelIlanSnap.exists()) {
        setHata("Bu ilan artık mevcut değil.");
        return;
      }

      const guncelIlan: any = {
        id: guncelIlanSnap.id,
        ...guncelIlanSnap.data(),
      };

      if (guncelIlan.durum !== "Açık") {
        setIlan(guncelIlan);
        setHata("Bu ilan artık teklif almıyor.");
        return;
      }

      if (guncelIlan.userId === userId) {
        setHata("Kendi ilanına teklif veremezsin.");
        return;
      }

      await addDoc(collection(db, "teklifler"), {
        ilanId: String(guncelIlan.id),

        ilanSahibiId: String(guncelIlan.userId || ""),

        nakliyeciId: String(userId),

        nereden: String(guncelIlan.nereden || ""),

        nereye: String(guncelIlan.nereye || ""),

        yukTuru: String(guncelIlan.yukTuru || ""),

        agirlik: String(guncelIlan.agirlik || ""),

        ilanFiyati: Number(guncelIlan.fiyat || 0),

        teklifFiyati: fiyat,

        fiyat: fiyat,

        paraBirimi: paraBirimi,

        mesaj: mesaj.trim(),

        durum: "Bekliyor",

        createdAt: serverTimestamp(),
      });

      await yeniTeklifBildirimi(guncelIlan);

      setBasari("Teklifin başarıyla gönderildi! 🎉");

      setTeklifFiyati("");
      setMesaj("");
    } catch (error: any) {
      const kod = error?.code || "";

      if (kod === "permission-denied") {
        setHata(
          "Firebase teklif göndermeye izin vermedi. Firestore Rules güncellenmeli."
        );
      } else {
        setHata(
          `Teklif gönderilirken bir hata oluştu${
            kod ? `: ${kod}` : "."
          }`
        );
      }
    } finally {
      setGonderiliyor(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-5xl mb-4">📦</div>

          <p className="text-xl font-bold">
            İlan yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // İLAN YOK
  // ==========================================

  if (!ilan) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">⚠️</div>

          <h1 className="text-2xl font-extrabold text-red-600">
            İlan Bulunamadı
          </h1>

          <p className="text-gray-500 mt-3">
            {hata || "Bu ilan mevcut değil."}
          </p>

          <button
            type="button"
            onClick={() => {
              router.push("/ilanlar");
            }}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← İlanlara Dön
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // DURUMLAR
  // ==========================================

  const kendiIlanim = ilan.userId === userId;
  const acik = ilan.durum === "Açık";
  const anlasildi = ilan.durum === "Anlaşıldı";
  const tamamlandi = ilan.durum === "Tamamlandı";
  const kapali = ilan.durum === "Kapalı";

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => {
            router.push("/ilanlar");
          }}
          className="mb-6 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
        >
          ← İlanlara Dön
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8">
          {/* ÜST */}

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-700">
                📍 {ilan.nereden || "-"} → {ilan.nereye || "-"}
              </h1>

              <p className="text-gray-500 mt-3">
                Yük ilanı detayları
              </p>
            </div>

            <span
              className={`self-start px-5 py-3 rounded-2xl font-extrabold ${
                tamamlandi
                  ? "bg-purple-100 text-purple-700"
                  : anlasildi
                  ? "bg-green-100 text-green-700"
                  : kapali
                  ? "bg-gray-200 text-gray-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {tamamlandi
                ? "🏁 Tamamlandı"
                : anlasildi
                ? "✅ Anlaşıldı"
                : kapali
                ? "🔒 Kapalı"
                : "🟢 Açık"}
            </span>
          </div>

          {/* BİLGİLER */}

          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-500">
                📦 Yük Türü
              </p>

              <p className="text-lg font-bold mt-1">
                {ilan.yukTuru || "-"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-500">
                ⚖️ Ağırlık
              </p>

              <p className="text-lg font-bold mt-1">
                {ilan.agirlik || "-"}
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-5 sm:col-span-2">
              <p className="text-gray-500">
                💰 İstenen Fiyat
              </p>

              <p className="text-2xl font-extrabold text-green-600 mt-1">
                {fiyatGoster()}
              </p>
            </div>
          </div>

          {/* AÇIKLAMA */}

          {ilan.aciklama && (
            <div className="mt-5 bg-gray-50 rounded-2xl p-5">
              <p className="font-extrabold">
                📝 Açıklama
              </p>

              <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                {ilan.aciklama}
              </p>
            </div>
          )}

          {/* PAYLAŞ */}

          <div className="mt-6 border border-purple-200 bg-purple-50 rounded-3xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">
                📤
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-purple-900">
                  Bu İlanı Paylaş
                </h2>

                <p className="text-purple-700 mt-1">
                  İlanı WhatsApp, Facebook, X veya telefonundaki
                  uygulamalarla paylaş.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
              <button
                type="button"
                onClick={whatsAppPaylas}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-extrabold"
              >
                💬 WhatsApp
              </button>

              <button
                type="button"
                onClick={facebookPaylas}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-extrabold"
              >
                📘 Facebook
              </button>

              <button
                type="button"
                onClick={xPaylas}
                className="bg-gray-900 hover:bg-black text-white px-4 py-3 rounded-xl font-extrabold"
              >
                𝕏 X
              </button>

              <button
                type="button"
                onClick={baglantiyiKopyala}
                className="bg-white hover:bg-gray-50 border border-purple-300 text-purple-800 px-4 py-3 rounded-xl font-extrabold"
              >
                🔗 Linki Kopyala
              </button>
            </div>

            <button
              type="button"
              onClick={cihazdanPaylas}
              className="w-full mt-3 bg-purple-700 hover:bg-purple-800 text-white px-5 py-3 rounded-xl font-extrabold"
            >
              📲 Telefonda Paylaş / Instagram
            </button>

            {paylasimMesaji !== "" && (
              <div className="mt-4 bg-white border border-purple-200 rounded-xl p-3 text-center font-bold text-purple-800">
                {paylasimMesaji}
              </div>
            )}
          </div>

          {/* HATA */}

          {hata !== "" && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">
              ⚠️ {hata}
            </div>
          )}

          {/* BAŞARI */}

          {basari !== "" && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 font-bold">
              {basari}
            </div>
          )}

          {/* İLAN AÇIK DEĞİL */}

          {!acik ? (
            <div className="mt-8 bg-gray-50 border border-gray-200 rounded-3xl p-6 text-center">
              <div className="text-5xl mb-3">
                {tamamlandi
                  ? "🏁"
                  : anlasildi
                  ? "🤝"
                  : "🔒"}
              </div>

              <h2 className="text-2xl font-extrabold">
                {tamamlandi
                  ? "Bu taşıma tamamlandı"
                  : anlasildi
                  ? "Bu ilan için anlaşma sağlandı"
                  : "Bu ilan kapalı"}
              </h2>

              <p className="text-gray-500 mt-2">
                Bu ilana artık yeni teklif verilemez.
              </p>

              {(anlasildi || tamamlandi) && userId && (
                <button
                  type="button"
                  onClick={() => {
                    router.push("/anlasmalarim");
                  }}
                  className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold"
                >
                  🤝 Anlaşmalarım
                </button>
              )}
            </div>
          ) : kendiIlanim ? (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-3xl p-6 text-center">
              <div className="text-5xl mb-3">
                📦
              </div>

              <p className="font-extrabold text-blue-700 text-lg">
                Bu ilan sana ait
              </p>

              <p className="text-blue-600 mt-2">
                Kendi ilanına teklif veremezsin.
              </p>

              <button
                type="button"
                onClick={() => {
                  router.push("/gelen-teklifler");
                }}
                className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
              >
                💰 Gelen Teklifleri Gör
              </button>
            </div>
          ) : !userId ? (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-3xl p-6 text-center">
              <div className="text-5xl mb-3">
                🔐
              </div>

              <p className="font-extrabold text-yellow-700 text-lg">
                Teklif vermek için giriş yap
              </p>

              <p className="text-yellow-700 mt-2">
                Hesabına giriş yaptıktan sonra bu ilana teklif
                verebilirsin.
              </p>

              <button
                type="button"
                onClick={() => {
                  router.push("/login");
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
              >
                Giriş Yap
              </button>
            </div>
          ) : (
            <div className="mt-8 border-t pt-8">
              <h2 className="text-2xl font-extrabold">
                💰 Teklif Ver
              </h2>

              <p className="text-gray-500 mt-2">
                Taşıma için fiyatını ve mesajını ilan sahibine
                gönder.
              </p>

              <div className="space-y-5 mt-6">
                <div>
                  <label className="block font-bold mb-2">
                    💰 Teklif Fiyatın
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={teklifFiyati}
                    onChange={(event) => {
                      setTeklifFiyati(
                        (event.currentTarget as any).value
                      );
                    }}
                    placeholder="Örn: 25000"
                    className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">
                    💱 Para Birimi
                  </label>

                  <select
                    value={paraBirimi}
                    onChange={(event) => {
                      setParaBirimi(
                        (event.currentTarget as any).value
                      );
                    }}
                    className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    <option value="TRY">
                      ₺ Türk Lirası
                    </option>

                    <option value="USD">
                      $ Amerikan Doları
                    </option>

                    <option value="EUR">
                      € Euro
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">
                    📝 Mesaj
                  </label>

                  <textarea
                    value={mesaj}
                    onChange={(event) => {
                      setMesaj(
                        (event.currentTarget as any).value
                      );
                    }}
                    placeholder="Taşıma ile ilgili mesajın..."
                    rows={4}
                    maxLength={500}
                    className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
                  />

                  <p className="text-sm text-gray-400 mt-2 text-right">
                    {mesaj.length}/500
                  </p>
                </div>

                <button
                  type="button"
                  onClick={teklifGonder}
                  disabled={gonderiliyor}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg"
                >
                  {gonderiliyor
                    ? "⏳ Teklif gönderiliyor..."
                    : "💰 Teklifi Gönder"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}