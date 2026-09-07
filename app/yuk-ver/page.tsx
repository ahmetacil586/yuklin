"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  useRouter,
} from "next/navigation";

import {
  auth,
  db,
} from "../firebase";

export default function YukVerPage() {
  const router = useRouter();

  const [
    user,
    setUser,
  ] = useState<User | null>(
    null
  );

  const [
    profilYukleniyor,
    setProfilYukleniyor,
  ] = useState(true);

  const [
    nereden,
    setNereden,
  ] = useState("");

  const [
    nereye,
    setNereye,
  ] = useState("");

  const [
    yukTuru,
    setYukTuru,
  ] = useState("");

  const [
    agirlik,
    setAgirlik,
  ] = useState("");

  const [
    fiyat,
    setFiyat,
  ] = useState("");

  const [
    paraBirimi,
    setParaBirimi,
  ] = useState("TRY");

  const [
    aciklama,
    setAciklama,
  ] = useState("");

  const [
    gonderiliyor,
    setGonderiliyor,
  ] = useState(false);

  const [
    mesaj,
    setMesaj,
  ] = useState("");

  // ==========================================
  // KULLANICI KONTROLÜ
  // ==========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (
          currentUser
        ) => {
          setUser(
            currentUser
          );

          setProfilYukleniyor(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ==========================================
  // İLAN OLUŞTUR
  // ==========================================

  async function ilanOlustur(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setMesaj("");

    const aktifUser =
      auth.currentUser;

    if (!aktifUser) {
      setMesaj(
        "❌ İlan vermek için önce giriş yapmalısın."
      );

      return;
    }

    const temizNereden =
      nereden.trim();

    const temizNereye =
      nereye.trim();

    const temizYukTuru =
      yukTuru.trim();

    const temizAgirlik =
      agirlik.trim();

    const temizAciklama =
      aciklama.trim();

    // ======================================
    // NEREDEN / NEREYE
    // ======================================

    if (
      temizNereden === "" ||
      temizNereye === ""
    ) {
      setMesaj(
        "❌ Nereden ve nereye bilgilerini gir."
      );

      return;
    }

    // ======================================
    // YÜK TÜRÜ
    // ======================================

    if (
      temizYukTuru ===
      ""
    ) {
      setMesaj(
        "❌ Yük türünü gir."
      );

      return;
    }

    // ======================================
    // AĞIRLIK
    // ======================================

    if (
      temizAgirlik ===
      ""
    ) {
      setMesaj(
        "❌ Yük ağırlığını gir."
      );

      return;
    }

    // ======================================
    // FİYAT
    // ======================================

    if (
      fiyat.trim() ===
      ""
    ) {
      setMesaj(
        "❌ Taşıma için ödeyeceğin fiyatı gir."
      );

      return;
    }

    const fiyatSayisi =
      Number(fiyat);

    if (
      Number.isNaN(
        fiyatSayisi
      ) ||
      fiyatSayisi <= 0
    ) {
      setMesaj(
        "❌ Geçerli bir fiyat gir."
      );

      return;
    }

    try {
      setGonderiliyor(
        true
      );

      // ======================================
      // FIRESTORE'A YÜK İLANINI KAYDET
      //
      // ARTIK HEM YÜK SAHİBİ
      // HEM NAKLİYECİ YÜK İLANI VEREBİLİR.
      // ======================================

      await addDoc(
        collection(
          db,
          "yukler"
        ),
        {
          userId:
            aktifUser.uid,

          nereden:
            temizNereden,

          nereye:
            temizNereye,

          yukTuru:
            temizYukTuru,

          agirlik:
            temizAgirlik,

          fiyat:
            fiyatSayisi,

          paraBirimi:
            paraBirimi,

          aciklama:
            temizAciklama,

          durum:
            "Açık",

          createdAt:
            serverTimestamp(),
        }
      );

      // ======================================
      // FORMU TEMİZLE
      // ======================================

      setNereden("");
      setNereye("");
      setYukTuru("");
      setAgirlik("");
      setFiyat("");

      setParaBirimi(
        "TRY"
      );

      setAciklama("");

      setMesaj(
        "✅ İlanın başarıyla yayınlandı! 🎉"
      );
    } catch (error: any) {
      const kod =
        error?.code ||
        "";

      if (
        kod ===
        "permission-denied"
      ) {
        setMesaj(
          "❌ Firebase izin vermedi. Firestore Rules güncellenmeli."
        );
      } else {
        setMesaj(
          "❌ İlan oluşturulurken bir hata oluştu."
        );
      }
    } finally {
      setGonderiliyor(
        false
      );
    }
  }

  // ==========================================
  // PROFİL YÜKLENİYOR
  // ==========================================

  if (
    profilYukleniyor
  ) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

          <div className="text-5xl mb-4">
            📦
          </div>

          <p className="text-xl font-bold">
            Yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  // ==========================================
  // GİRİŞ YOK
  // ==========================================

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center max-w-md w-full">

          <div className="text-6xl mb-5">
            🔐
          </div>

          <h1 className="text-3xl font-extrabold">
            Giriş Yapmalısın
          </h1>

          <p className="text-gray-500 mt-4">
            Yük ilanı vermek için önce hesabına giriş yapmalısın.
          </p>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/login"
              );
            }}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold"
          >
            Giriş Yap
          </button>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/"
              );
            }}
            className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold"
          >
            🏠 Ana Sayfa
          </button>

        </div>

      </main>
    );
  }

  // ==========================================
  // YÜK İLANI FORMU
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">

      <div className="max-w-3xl mx-auto">

        {/* ======================================
            BAŞLIK
        ====================================== */}

        <div className="text-center mb-10">

          <div className="text-6xl mb-4">
            📦
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700">
            Yük İlanı Ver
          </h1>

          <p className="text-gray-500 mt-3 text-base sm:text-lg">
            Yükünü yayınla, nakliyecilerden teklif al.
          </p>

          <p className="text-sm text-blue-600 mt-2 font-semibold">
            Giriş yapmış tüm kullanıcılar yük ilanı verebilir.
          </p>

        </div>

        {/* ======================================
            FORM KARTI
        ====================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8">

          <form
            onSubmit={
              ilanOlustur
            }
            className="space-y-6"
          >

            {/* ==================================
                NEREDEN
            ================================== */}

            <div>

              <label className="block font-bold mb-2">
                📍 Nereden?
              </label>

              <input
                type="text"
                value={
                  nereden
                }
                onChange={(
                  event
                ) => {
                  setNereden(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Örn: İstanbul"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ==================================
                NEREYE
            ================================== */}

            <div>

              <label className="block font-bold mb-2">
                📍 Nereye?
              </label>

              <input
                type="text"
                value={
                  nereye
                }
                onChange={(
                  event
                ) => {
                  setNereye(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Örn: Ankara"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ==================================
                YÜK TÜRÜ
            ================================== */}

            <div>

              <label className="block font-bold mb-2">
                📦 Yük Türü
              </label>

              <input
                type="text"
                value={
                  yukTuru
                }
                onChange={(
                  event
                ) => {
                  setYukTuru(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Örn: Mobilya"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ==================================
                AĞIRLIK
            ================================== */}

            <div>

              <label className="block font-bold mb-2">
                ⚖️ Ağırlık
              </label>

              <input
                type="text"
                value={
                  agirlik
                }
                onChange={(
                  event
                ) => {
                  setAgirlik(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Örn: 20 ton"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ==================================
                FİYAT
            ================================== */}

            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">

              <label className="block font-bold mb-2">
                💰 Taşıma İçin Vereceğiniz Ücret
              </label>

              <input
                type="number"
                min="1"
                value={
                  fiyat
                }
                onChange={(
                  event
                ) => {
                  setFiyat(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Örn: 30000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <select
                value={
                  paraBirimi
                }
                onChange={(
                  event
                ) => {
                  setParaBirimi(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mt-3 bg-white outline-none focus:border-green-600"
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

            {/* ==================================
                AÇIKLAMA
            ================================== */}

            <div>

              <label className="block font-bold mb-2">
                📝 Açıklama
              </label>

              <textarea
                value={
                  aciklama
                }
                onChange={(
                  event
                ) => {
                  setAciklama(
                    (
                      event.currentTarget as any
                    ).value
                  );
                }}
                placeholder="Yük hakkında ek bilgi..."
                rows={5}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
              />

              <p className="text-sm text-gray-400 mt-2 text-right">
                {aciklama.length}/1000
              </p>

            </div>

            {/* ==================================
                MESAJ
            ================================== */}

            {mesaj !== "" && (

              <div
                className={`rounded-xl p-4 font-bold text-center whitespace-pre-line ${
                  mesaj.startsWith(
                    "✅"
                  )
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                {mesaj}
              </div>

            )}

            {/* ==================================
                İLANI YAYINLA
            ================================== */}

            <button
              type="submit"
              disabled={
                gonderiliyor
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg"
            >
              {gonderiliyor
                ? "⏳ İlan yayınlanıyor..."
                : "📦 İlanı Yayınla"}
            </button>

            {/* ==================================
                ALT BUTONLAR
            ================================== */}

            <div className="grid sm:grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/ilanlar"
                  );
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold"
              >
                📋 Yük İlanları
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/"
                  );
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold"
              >
                🏠 Ana Sayfa
              </button>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
}