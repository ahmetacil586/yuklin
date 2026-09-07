"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  reload,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import {
  auth,
  db,
} from "../firebase";

export default function IlanlarPage() {
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [userId, setUserId] = useState("");

  // ==========================================
  // E-POSTA DOĞRULAMA
  // ==========================================

  const [
    emailDogrulandi,
    setEmailDogrulandi,
  ] = useState(false);

  const [
    seciliIlan,
    setSeciliIlan,
  ] = useState<any>(null);

  const [
    teklifFiyati,
    setTeklifFiyati,
  ] = useState("");

  const [
    paraBirimi,
    setParaBirimi,
  ] = useState("TRY");

  const [
    mesaj,
    setMesaj,
  ] = useState("");

  const [
    gonderiliyor,
    setGonderiliyor,
  ] = useState(false);

  const [
    hata,
    setHata,
  ] = useState("");

  const [
    basari,
    setBasari,
  ] = useState("");

  // ==========================================
  // KULLANICI + İLANLAR
  // ==========================================

  useEffect(() => {
    let unsubscribeIlanlar:
      (() => void) |
      null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {
          // ======================================
          // KULLANICI
          // ======================================

          if (user) {
            try {
              // Firebase'deki güncel
              // emailVerified bilgisini al.
              await reload(user);
            } catch {
              // reload başarısız olsa bile
              // mevcut kullanıcı bilgisi kullanılabilir.
            }

            const guncelUser =
              auth.currentUser ||
              user;

            setUserId(
              guncelUser.uid
            );

            setEmailDogrulandi(
              guncelUser.emailVerified ===
                true
            );
          } else {
            setUserId("");
            setEmailDogrulandi(false);
          }

          // ======================================
          // AÇIK İLANLAR
          // ======================================

          const ilanQuery =
            query(
              collection(
                db,
                "yukler"
              ),
              where(
                "durum",
                "==",
                "Açık"
              )
            );

          unsubscribeIlanlar =
            onSnapshot(
              ilanQuery,

              (snapshot) => {
                const liste =
                  snapshot.docs.map(
                    (item) => ({
                      id:
                        item.id,

                      ...item.data(),
                    })
                  );

                // Yeni ilanlar üstte.
                liste.sort(
                  (
                    a: any,
                    b: any
                  ) => {
                    const aTarih =
                      a.createdAt
                        ?.seconds ||
                      0;

                    const bTarih =
                      b.createdAt
                        ?.seconds ||
                      0;

                    return (
                      bTarih -
                      aTarih
                    );
                  }
                );

                setIlanlar(
                  liste
                );

                setYukleniyor(
                  false
                );
              },

              (error) => {
                console.error(
                  "İlan yükleme hatası:",
                  error
                );

                setHata(
                  "İlanlar yüklenirken bir hata oluştu."
                );

                setYukleniyor(
                  false
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (
        unsubscribeIlanlar
      ) {
        unsubscribeIlanlar();
      }
    };
  }, []);

  // ==========================================
  // FİYAT
  // ==========================================

  function fiyatGoster(
    ilan: any
  ) {
    const sembol =
      ilan.paraBirimi ===
      "USD"
        ? "$"
        : ilan.paraBirimi ===
          "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      ilan.fiyat ||
        0
    ).toLocaleString(
      "tr-TR"
    )}`;
  }

  // ==========================================
  // TEKLİF PENCERESİNİ AÇ
  // ==========================================

  async function teklifAc(
    ilan: any
  ) {
    setHata("");
    setBasari("");

    // ======================================
    // GİRİŞ
    // ======================================

    if (!userId) {
      router.push(
        "/login"
      );

      return;
    }

    // ======================================
    // KENDİ İLANI
    // ======================================

    if (
      ilan.userId &&
      ilan.userId === userId
    ) {
      setHata(
        "Kendi ilanına teklif veremezsin."
      );

      return;
    }

    // ======================================
    // E-POSTA DOĞRULAMA
    // ======================================

    const user =
      auth.currentUser;

    if (user) {
      try {
        await reload(user);

        const guncelUser =
          auth.currentUser ||
          user;

        const dogrulandi =
          guncelUser.emailVerified ===
          true;

        setEmailDogrulandi(
          dogrulandi
        );

        if (!dogrulandi) {
          setHata(
            "Teklif verebilmek için önce e-posta adresini doğrulamalısın."
          );

          return;
        }
      } catch {
        if (
          !emailDogrulandi
        ) {
          setHata(
            "E-posta doğrulama durumu kontrol edilemedi."
          );

          return;
        }
      }
    }

    // ======================================
    // MODALI AÇ
    // ======================================

    setSeciliIlan(
      ilan
    );

    setTeklifFiyati(
      ""
    );

    setParaBirimi(
      ilan.paraBirimi ||
        "TRY"
    );

    setMesaj("");
  }

  // ==========================================
  // TEKLİF PENCERESİNİ KAPAT
  // ==========================================

  function teklifKapat() {
    if (
      gonderiliyor
    ) {
      return;
    }

    setSeciliIlan(
      null
    );

    setTeklifFiyati(
      ""
    );

    setMesaj("");

    setHata("");
  }

  // ==========================================
  // TEKLİF GÖNDER
  // ==========================================

  async function teklifGonder() {
    if (!seciliIlan) {
      return;
    }

    setHata("");
    setBasari("");

    // ======================================
    // GİRİŞ
    // ======================================

    if (!userId) {
      router.push(
        "/login"
      );

      return;
    }

    // ======================================
    // E-POSTA DOĞRULAMA
    // ======================================

    const user =
      auth.currentUser;

    if (!user) {
      router.push(
        "/login"
      );

      return;
    }

    try {
      await reload(user);

      const guncelUser =
        auth.currentUser ||
        user;

      if (
        !guncelUser.emailVerified
      ) {
        setEmailDogrulandi(
          false
        );

        setHata(
          "Teklif verebilmek için önce e-posta adresini doğrulamalısın."
        );

        return;
      }

      setEmailDogrulandi(
        true
      );
    } catch {
      if (
        !emailDogrulandi
      ) {
        setHata(
          "E-posta doğrulama durumu kontrol edilemedi."
        );

        return;
      }
    }

    // ======================================
    // KENDİ İLANINA TEKLİF YOK
    // ======================================

    if (
      seciliIlan.userId &&
      seciliIlan.userId ===
        userId
    ) {
      setHata(
        "Kendi ilanına teklif veremezsin."
      );

      return;
    }

    // ======================================
    // FİYAT
    // ======================================

    if (
      teklifFiyati.trim() ===
      ""
    ) {
      setHata(
        "Lütfen teklif fiyatını gir."
      );

      return;
    }

    const fiyat =
      Number(
        teklifFiyati
      );

    if (
      Number.isNaN(
        fiyat
      ) ||
      fiyat <= 0
    ) {
      setHata(
        "Geçerli bir teklif fiyatı gir."
      );

      return;
    }

    try {
      setGonderiliyor(
        true
      );

      // ======================================
      // İLANI SON KEZ FIRESTORE'DAN KONTROL ET
      // ======================================

      const guncelIlanSnap =
        await getDoc(
          doc(
            db,
            "yukler",
            String(
              seciliIlan.id
            )
          )
        );

      if (
        !guncelIlanSnap.exists()
      ) {
        setHata(
          "Bu ilan artık mevcut değil."
        );

        return;
      }

      const guncelIlan:
        any = {
        id:
          guncelIlanSnap.id,

        ...guncelIlanSnap.data(),
      };

      // ======================================
      // İLAN HALA AÇIK MI?
      // ======================================

      if (
        guncelIlan.durum !==
        "Açık"
      ) {
        setHata(
          "Bu ilan artık teklif almıyor."
        );

        return;
      }

      // ======================================
      // KENDİ İLANI MI?
      // ======================================

      if (
        guncelIlan.userId ===
        userId
      ) {
        setHata(
          "Kendi ilanına teklif veremezsin."
        );

        return;
      }

      // ======================================
      // TEKLİFİ OLUŞTUR
      // ======================================

      await addDoc(
        collection(
          db,
          "teklifler"
        ),
        {
          ilanId:
            String(
              guncelIlan.id
            ),

          ilanSahibiId:
            String(
              guncelIlan.userId ||
                ""
            ),

          // Eski sistemle uyum için
          // alan adı nakliyeciId kalıyor.
          // Artık herhangi bir kullanıcı
          // teklif verebilir.
          nakliyeciId:
            String(
              userId
            ),

          nereden:
            String(
              guncelIlan.nereden ||
                ""
            ),

          nereye:
            String(
              guncelIlan.nereye ||
                ""
            ),

          yukTuru:
            String(
              guncelIlan.yukTuru ||
                ""
            ),

          agirlik:
            String(
              guncelIlan.agirlik ||
                ""
            ),

          ilanFiyati:
            Number(
              guncelIlan.fiyat ||
                0
            ),

          teklifFiyati:
            Number(
              fiyat
            ),

          fiyat:
            Number(
              fiyat
            ),

          paraBirimi:
            String(
              paraBirimi
            ),

          mesaj:
            mesaj.trim(),

          durum:
            "Bekliyor",

          createdAt:
            serverTimestamp(),
        }
      );

      // ======================================
      // İLAN SAHİBİNE BİLDİRİM
      // ======================================

      try {
        await addDoc(
          collection(
            db,
            "bildirimler"
          ),
          {
            kullaniciId:
              String(
                guncelIlan.userId
              ),

            baslik:
              "💰 Yeni Teklif Geldi",

            mesaj:
              `${
                guncelIlan.nereden ||
                "Yük"
              } → ${
                guncelIlan.nereye ||
                ""
              } ilanına yeni bir taşıma teklifi geldi.`,

            tip:
              "yeni_teklif",

            hedef:
              "/gelen-teklifler",

            okundu:
              false,

            createdAt:
              serverTimestamp(),
          }
        );
      } catch (
        bildirimError
      ) {
        console.error(
          "Bildirim oluşturulamadı:",
          bildirimError
        );

        // Bildirim hatası teklif
        // işlemini bozmasın.
      }

      // ======================================
      // BAŞARI
      // ======================================

      setBasari(
        "Teklifin başarıyla gönderildi! 🎉"
      );

      setSeciliIlan(
        null
      );

      setTeklifFiyati(
        ""
      );

      setMesaj("");

    } catch (
      error: any
    ) {
      console.error(
        "Teklif gönderme hatası:",
        error
      );

      const firebaseKod =
        error?.code ||
        "";

      const firebaseMesaj =
        error?.message ||
        "";

      if (
        firebaseKod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase teklif göndermeye izin vermedi."
        );
      } else {
        setHata(
          `Teklif gönderilemedi: ${
            firebaseKod ||
            firebaseMesaj ||
            "Bilinmeyen hata"
          }`
        );
      }

    } finally {
      setGonderiliyor(
        false
      );
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (yukleniyor) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

          <div className="text-5xl mb-4">
            📋
          </div>

          <p className="text-xl font-bold">
            İlanlar yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">

      <div className="max-w-6xl mx-auto">

        {/* ======================================
            BAŞLIK
        ====================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

          <div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700">
              📋 Yük İlanları
            </h1>

            <p className="text-gray-500 mt-2">
              Uygun yükleri bul ve taşıma teklifini gönder.
            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/yuk-ver"
                );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              📦 Yük İlanı Ver
            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/"
                );
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold"
            >
              🏠 Ana Sayfa
            </button>

          </div>

        </div>

        {/* ======================================
            E-POSTA UYARISI
        ====================================== */}

        {userId !== "" &&
          !emailDogrulandi && (

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>

                <p className="font-extrabold text-yellow-700">
                  📧 E-posta adresini doğrula
                </p>

                <p className="text-yellow-700/80 mt-1">
                  İlanları inceleyebilirsin ancak teklif verebilmek için e-posta adresini doğrulamalısın.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/profil"
                  );
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold whitespace-nowrap"
              >
                Doğrulamaya Git →
              </button>

            </div>

          </div>

        )}

        {/* ======================================
            HATA
        ====================================== */}

        {hata !== "" && (

          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 font-bold">
            ⚠️ {hata}
          </div>

        )}

        {/* ======================================
            BAŞARI
        ====================================== */}

        {basari !== "" && (

          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6 font-bold">
            {basari}
          </div>

        )}

        {/* ======================================
            İLANLAR
        ====================================== */}

        {ilanlar.length ===
        0 ? (

          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">

            <div className="text-7xl">
              📦
            </div>

            <h2 className="text-2xl font-extrabold mt-5">
              Şu anda açık ilan yok
            </h2>

            <p className="text-gray-500 mt-3">
              Yeni yük ilanları yayınlandığında burada görünecek.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {ilanlar.map(
              (ilan) => {
                const kendiIlanim =
                  userId !== "" &&
                  ilan.userId ===
                    userId;

                return (
                  <div
                    key={
                      ilan.id
                    }
                    className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
                  >

                    {/* ==================================
                        ROTA
                    ================================== */}

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <h2 className="text-2xl font-extrabold text-blue-700">
                          📍{" "}
                          {ilan.nereden ||
                            "-"}{" "}
                          →{" "}
                          {ilan.nereye ||
                            "-"}
                        </h2>

                        <div className="flex flex-wrap gap-2 mt-3">

                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            🟢 Açık
                          </span>

                          {kendiIlanim && (

                            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                              👤 Benim İlanım
                            </span>

                          )}

                        </div>

                      </div>

                    </div>

                    {/* ==================================
                        BİLGİLER
                    ================================== */}

                    <div className="mt-5 space-y-3">

                      <p>
                        📦{" "}
                        <strong>
                          Yük Türü:
                        </strong>{" "}
                        {ilan.yukTuru ||
                          "-"}
                      </p>

                      <p>
                        ⚖️{" "}
                        <strong>
                          Ağırlık:
                        </strong>{" "}
                        {ilan.agirlik ||
                          "-"}
                      </p>

                      <p>
                        💰{" "}
                        <strong>
                          İstenen Ücret:
                        </strong>{" "}

                        <span className="font-extrabold text-green-600">
                          {fiyatGoster(
                            ilan
                          )}
                        </span>

                      </p>

                      {ilan.aciklama && (

                        <div className="bg-gray-50 rounded-2xl p-4">

                          <p className="font-bold">
                            📝 Açıklama
                          </p>

                          <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                            {ilan.aciklama}
                          </p>

                        </div>

                      )}

                    </div>

                    {/* ==================================
                        BUTONLAR
                    ================================== */}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">

                      {/* ==================================
                          BAŞKASININ İLANI +
                          DOĞRULANMIŞ
                      ================================== */}

                      {!kendiIlanim &&
                        userId &&
                        emailDogrulandi && (

                        <button
                          type="button"
                          onClick={() => {
                            teklifAc(
                              ilan
                            );
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-extrabold"
                        >
                          💰 Teklif Ver
                        </button>

                      )}

                      {/* ==================================
                          BAŞKASININ İLANI +
                          DOĞRULANMAMIŞ
                      ================================== */}

                      {!kendiIlanim &&
                        userId &&
                        !emailDogrulandi && (

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              "/profil"
                            );
                          }}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-extrabold"
                        >
                          📧 E-postanı Doğrula
                        </button>

                      )}

                      {/* ==================================
                          KENDİ İLANI
                      ================================== */}

                      {kendiIlanim && (

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              "/gelen-teklifler"
                            );
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-extrabold"
                        >
                          💰 Gelen Teklifler
                        </button>

                      )}

                      {/* ==================================
                          GİRİŞ YOK
                      ================================== */}

                      {!userId && (

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              "/login"
                            );
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-extrabold"
                        >
                          🔐 Teklif İçin Giriş Yap
                        </button>

                      )}

                      {/* DETAY */}

                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/ilan/${ilan.id}`
                          );
                        }}
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                      >
                        🔎 Detay
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ==========================================
          TEKLİF MODALI
      ========================================== */}

      {seciliIlan && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto">

            {/* ======================================
                BAŞLIK
            ====================================== */}

            <div className="flex items-start justify-between gap-4 mb-6">

              <div>

                <h2 className="text-2xl font-extrabold text-green-600">
                  💰 Teklif Ver
                </h2>

                <p className="text-gray-500 mt-1">
                  {seciliIlan.nereden ||
                    "-"}{" "}
                  →{" "}
                  {seciliIlan.nereye ||
                    "-"}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  teklifKapat
                }
                disabled={
                  gonderiliyor
                }
                className="text-gray-500 hover:text-gray-900 text-2xl font-bold"
              >
                ✕
              </button>

            </div>

            {/* ======================================
                İLAN FİYATI
            ====================================== */}

            <div className="bg-blue-50 rounded-2xl p-4 mb-5">

              <p className="font-bold text-blue-700">
                İlan sahibinin istediği:
              </p>

              <p className="text-2xl font-extrabold mt-1">
                {fiyatGoster(
                  seciliIlan
                )}
              </p>

            </div>

            {/* HATA */}

            {hata !== "" && (

              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5 font-bold">
                ⚠️ {hata}
              </div>

            )}

            <div className="space-y-5">

              {/* ======================================
                  TEKLİF FİYATI
              ====================================== */}

              <div>

                <label className="block font-bold mb-2">
                  💰 Teklif Fiyatın
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    teklifFiyati
                  }
                  onChange={(
                    event
                  ) => {
                    setTeklifFiyati(
                      event.currentTarget
                        .value
                    );
                  }}
                  placeholder="Örn: 25000"
                  className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

              </div>

              {/* ======================================
                  PARA BİRİMİ
              ====================================== */}

              <div>

                <label className="block font-bold mb-2">
                  💱 Para Birimi
                </label>

                <select
                  value={
                    paraBirimi
                  }
                  onChange={(
                    event
                  ) => {
                    setParaBirimi(
                      event.currentTarget
                        .value
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

              {/* ======================================
                  MESAJ
              ====================================== */}

              <div>

                <label className="block font-bold mb-2">
                  📝 Mesaj
                </label>

                <textarea
                  value={
                    mesaj
                  }
                  onChange={(
                    event
                  ) => {
                    setMesaj(
                      event.currentTarget
                        .value
                    );
                  }}
                  placeholder="Taşıma ile ilgili mesajın..."
                  rows={4}
                  maxLength={500}
                  className="w-full border border-gray-300 rounded-xl p-4 resize-none outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />

                <p className="text-sm text-gray-400 mt-2 text-right">
                  {mesaj.length}/500
                </p>

              </div>

              {/* ======================================
                  BUTONLAR
              ====================================== */}

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={
                    teklifKapat
                  }
                  disabled={
                    gonderiliyor
                  }
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 py-4 rounded-xl font-bold"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={
                    teklifGonder
                  }
                  disabled={
                    gonderiliyor
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-extrabold"
                >
                  {gonderiliyor
                    ? "⏳ Gönderiliyor..."
                    : "💰 Teklifi Gönder"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}