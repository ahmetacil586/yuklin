"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { useParams, useRouter } from "next/navigation";

import { auth, db } from "../../firebase";

export default function IlanDetayPage() {
  const params = useParams();
  const router = useRouter();

  const ilanId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [ilan, setIlan] = useState<any>(null);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const [teklifFiyati, setTeklifFiyati] = useState("");
  const [teklifMesaji, setTeklifMesaji] = useState("");

  const [mesaj, setMesaj] = useState("");
  const [paylasimMesaji, setPaylasimMesaji] = useState("");

  // ==========================================
  // KULLANICI
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // İLANI GETİR
  // ==========================================

  useEffect(() => {
    async function ilanGetir() {
      if (!ilanId) return;

      try {
        setYukleniyor(true);

        const ilanRef = doc(
          db,
          "yukler",
          ilanId
        );

        const ilanDoc = await getDoc(ilanRef);

        if (!ilanDoc.exists()) {
          setIlan(null);
          return;
        }

        setIlan({
          id: ilanDoc.id,
          ...ilanDoc.data(),
        });
      } catch (error) {
        console.error(
          "İlan alınamadı:",
          error
        );
      } finally {
        setYukleniyor(false);
      }
    }

    ilanGetir();
  }, [ilanId]);

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster(
    fiyat: number,
    paraBirimi: string
  ) {
    const sembol =
      paraBirimi === "USD"
        ? "$"
        : paraBirimi === "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      fiyat || 0
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

    return `🚛 YÜKLİN'de Yük İlanı

📍 ${ilan.nereden || "-"} → ${ilan.nereye || "-"}
📦 Yük: ${ilan.yukTuru || "-"}
⚖️ Ağırlık: ${ilan.agirlik || "-"}
💰 İstenen Ücret: ${fiyatGoster(
      ilan.fiyat,
      ilan.paraBirimi || "TRY"
    )}

İlanı incele:
${ilanLinkiOlustur()}`;
  }

  // ==========================================
  // WHATSAPP
  // ==========================================

  function whatsAppPaylas() {
    const metin = encodeURIComponent(
      paylasimMetniOlustur()
    );

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
    const link = encodeURIComponent(
      ilanLinkiOlustur()
    );

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

    const link = encodeURIComponent(
      ilanLinkiOlustur()
    );

    window.open(
      `https://twitter.com/intent/tweet?text=${metin}&url=${link}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ==========================================
  // LİNKİ KOPYALA
  // ==========================================

  async function baglantiyiKopyala() {
    try {
      await navigator.clipboard.writeText(
        ilanLinkiOlustur()
      );

      setPaylasimMesaji(
        "✅ İlan bağlantısı kopyalandı!"
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 2500);
    } catch {
      setPaylasimMesaji(
        "❌ Bağlantı kopyalanamadı."
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 2500);
    }
  }

  // ==========================================
  // TELEFONDAN PAYLAŞ
  // ==========================================

  async function cihazdanPaylas() {
    const link = ilanLinkiOlustur();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `YÜKLİN | ${
            ilan?.nereden || ""
          } → ${ilan?.nereye || ""}`,

          text: paylasimMetniOlustur(),

          url: link,
        });
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setPaylasimMesaji(
            "❌ Paylaşım açılamadı."
          );

          window.setTimeout(() => {
            setPaylasimMesaji("");
          }, 2500);
        }
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(
        paylasimMetniOlustur()
      );

      setPaylasimMesaji(
        "📋 Paylaşım metni kopyalandı. Instagram, Messenger veya başka bir uygulamaya yapıştırabilirsin."
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 4000);
    } catch {
      setPaylasimMesaji(
        "❌ Bu cihazda paylaşım özelliği kullanılamıyor."
      );

      window.setTimeout(() => {
        setPaylasimMesaji("");
      }, 3000);
    }
  }

  // ==========================================
  // TEKLİF GÖNDER
  // ==========================================

  async function teklifGonder() {
    setMesaj("");

    if (!user) {
      setMesaj(
        "❌ Teklif vermek için önce giriş yapmalısın."
      );

      return;
    }

    if (!ilan) {
      setMesaj(
        "❌ İlan bulunamadı."
      );

      return;
    }

    if (!teklifFiyati) {
      setMesaj(
        "❌ Teklif fiyatını gir."
      );

      return;
    }

    const fiyat = Number(teklifFiyati);

    if (fiyat <= 0) {
      setMesaj(
        "❌ Geçerli bir teklif fiyatı gir."
      );

      return;
    }

    if (ilan.userId === user.uid) {
      setMesaj(
        "❌ Kendi ilanına teklif veremezsin."
      );

      return;
    }

    try {
      setGonderiliyor(true);

      await addDoc(
        collection(db, "teklifler"),
        {
          ilanId: ilan.id,

          ilanSahibiId:
            ilan.userId,

          nakliyeciId:
            user.uid,

          teklifFiyati:
            fiyat,

          paraBirimi:
            ilan.paraBirimi || "TRY",

          mesaj:
            teklifMesaji.trim(),

          durum:
            "Bekliyor",

          createdAt:
            serverTimestamp(),
        }
      );

      setTeklifFiyati("");
      setTeklifMesaji("");

      setMesaj(
        "✅ Teklifin başarıyla gönderildi! 🎉"
      );
    } catch (error: any) {
      console.error(
        "Teklif gönderilemedi:",
        error
      );

      setMesaj(
        "❌ Teklif gönderilirken hata oluştu:\n\n" +
          (error?.message ||
            "Bilinmeyen hata")
      );
    } finally {
      setGonderiliyor(false);
    }
  }

  // ==========================================
  // YÜKLENİYOR
  // ==========================================

  if (yukleniyor) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
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
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-6xl mb-4">
            📦
          </div>

          <h1 className="text-3xl font-extrabold">
            İlan bulunamadı
          </h1>

          <button
            type="button"
            onClick={() =>
              router.push("/ilanlar")
            }
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← İlanlara Dön
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // KENDİ İLANI MI?
  // ==========================================

  const kendiIlanin =
    user && ilan.userId === user.uid;

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">

        {/* GERİ */}

        <button
          type="button"
          onClick={() =>
            router.push("/ilanlar")
          }
          className="mb-6 text-blue-600 font-bold"
        >
          ← Yük İlanlarına Dön
        </button>

        {/* İLAN */}

        <div className="bg-white rounded-3xl shadow-xl p-8">

          {/* ÜST */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-blue-700">
                📍 {ilan.nereden} →{" "}
                {ilan.nereye}
              </h1>

              <p className="text-gray-500 mt-2">
                Yük ilanı
              </p>
            </div>

            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
              🟢 {ilan.durum || "Açık"}
            </span>
          </div>

          {/* BİLGİLER */}

          <div className="grid md:grid-cols-2 gap-5 mt-8">
            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-500">
                📦 Yük Türü
              </p>

              <p className="text-xl font-extrabold mt-1">
                {ilan.yukTuru}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-500">
                ⚖️ Ağırlık
              </p>

              <p className="text-xl font-extrabold mt-1">
                {ilan.agirlik}
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-5">
              <p className="text-gray-500">
                💰 İstenen Ücret
              </p>

              <p className="text-2xl font-extrabold text-green-700 mt-1">
                {fiyatGoster(
                  ilan.fiyat,
                  ilan.paraBirimi
                )}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5">
              <p className="text-gray-500">
                📋 Durum
              </p>

              <p className="text-xl font-extrabold mt-1">
                {ilan.durum || "Açık"}
              </p>
            </div>
          </div>

          {/* AÇIKLAMA */}

          {ilan.aciklama && (
            <div className="mt-6 bg-gray-50 rounded-2xl p-6">
              <h2 className="font-extrabold text-lg">
                📝 Açıklama
              </h2>

              <p className="text-gray-600 mt-2 whitespace-pre-line">
                {ilan.aciklama}
              </p>
            </div>
          )}

          {/* ======================================
              PAYLAŞIM
          ====================================== */}

          <div className="mt-8 border border-purple-200 bg-purple-50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">
                📤
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-purple-800">
                  Bu İlanı Paylaş
                </h2>

                <p className="text-gray-600 mt-1">
                  Bu yükü daha fazla kişiye ulaştır.
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

            {paylasimMesaji && (
              <div className="mt-4 bg-white border border-purple-200 rounded-xl p-3 text-center font-bold text-purple-800">
                {paylasimMesaji}
              </div>
            )}
          </div>

          {/* KENDİ İLANIN */}

          {kendiIlanin && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h2 className="font-extrabold text-blue-700 text-xl">
                📦 Bu senin ilanının
              </h2>

              <p className="text-gray-600 mt-2">
                Kendi ilanına teklif veremezsin.
                Gelen teklifleri teklif yönetim
                bölümünden inceleyebilirsin.
              </p>
            </div>
          )}

          {/* TEKLİF FORMU */}

          {!kendiIlanin &&
            ilan.durum !== "Anlaşıldı" && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-3xl font-extrabold">
                  💰 Teklif Ver
                </h2>

                <p className="text-gray-500 mt-2">
                  Bu yükü taşıyabileceğin fiyatı
                  girerek teklif gönder.
                </p>

                <div className="mt-6 space-y-5">

                  {/* FİYAT */}

                  <div>
                    <label className="block font-bold mb-2">
                      💰 Teklif Fiyatın
                    </label>

                    <input
                      type="number"
                      value={teklifFiyati}
                      onChange={(e) =>
                        setTeklifFiyati(
                          e.target.value
                        )
                      }
                      placeholder="Örn: 25000"
                      className="w-full border rounded-xl p-4"
                    />
                  </div>

                  {/* MESAJ */}

                  <div>
                    <label className="block font-bold mb-2">
                      📝 Mesaj
                    </label>

                    <textarea
                      value={teklifMesaji}
                      onChange={(e) =>
                        setTeklifMesaji(
                          e.target.value
                        )
                      }
                      placeholder="Örn: Yükünüzü belirtilen tarihte taşıyabilirim."
                      rows={4}
                      className="w-full border rounded-xl p-4"
                    />
                  </div>

                  {/* MESAJ */}

                  {mesaj && (
                    <div className="bg-gray-50 rounded-xl p-4 text-center font-bold whitespace-pre-line">
                      {mesaj}
                    </div>
                  )}

                  {/* GÖNDER */}

                  <button
                    type="button"
                    onClick={teklifGonder}
                    disabled={gonderiliyor}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-extrabold text-lg"
                  >
                    {gonderiliyor
                      ? "⏳ Teklif gönderiliyor..."
                      : "💰 Teklifi Gönder"}
                  </button>
                </div>
              </div>
            )}

          {/* GİRİŞ UYARISI */}

          {!user &&
            ilan.durum !== "Anlaşıldı" && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                <p className="font-bold text-yellow-800">
                  🔐 Teklif vermek için giriş yapmalısın.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
                >
                  Giriş Yap
                </button>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}