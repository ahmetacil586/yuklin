"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

type TeklifTuru = "normal" | "arac";

type Teklif = {
  id: string;
  teklifTuru: TeklifTuru;

  durum?: string;
  createdAt?: any;

  // NORMAL TEKLİF
  ilanId?: string;
  ilanSahibiId?: string;
  nakliyeciId?: string;
  teklifFiyati?: number;
  fiyat?: number;
  paraBirimi?: string;
  mesaj?: string;
  anlasmaId?: string;

  ilan?: any;

  // BOŞ ARACA GÖNDERİLEN YÜK TEKLİFİ
  yukId?: string;
  aracId?: string;
  yukSahibiId?: string;
  aracSahibiId?: string;

  nereden?: string;
  nereye?: string;
  yukTuru?: string;
  agirlik?: string;
  yukFiyati?: number;

  aracTipi?: string;
  kapasite?: string;
  aracBulunduguYer?: string;
  aracGidecegiYer?: string;

  yuk?: any;
  arac?: any;
  aracSahibi?: any;
};

export default function TekliflerimPage() {
  const router = useRouter();

  const [normalTeklifler, setNormalTeklifler] = useState<
    Teklif[]
  >([]);

  const [aracTeklifleri, setAracTeklifleri] = useState<
    Teklif[]
  >([]);

  const [normalLoading, setNormalLoading] =
    useState(true);

  const [aracLoading, setAracLoading] =
    useState(true);

  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");

  const [duzenlenenTeklif, setDuzenlenenTeklif] =
    useState<Teklif | null>(null);

  const [yeniFiyat, setYeniFiyat] = useState("");
  const [yeniMesaj, setYeniMesaj] = useState("");

  const [yeniParaBirimi, setYeniParaBirimi] =
    useState("TRY");

  const [kaydediliyor, setKaydediliyor] =
    useState(false);

  // ==========================================
  // TEKLİFLERİ YÜKLE
  // ==========================================

  useEffect(() => {
    let unsubscribeNormal:
      | (() => void)
      | null = null;

    let unsubscribeArac:
      | (() => void)
      | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        // ======================================
        // NORMAL TEKLİFLERİM
        // ======================================

        const normalQuery = query(
          collection(db, "teklifler"),
          where(
            "nakliyeciId",
            "==",
            user.uid
          )
        );

        unsubscribeNormal = onSnapshot(
          normalQuery,

          async (snapshot) => {
            try {
              const liste = await Promise.all(
                snapshot.docs.map(
                  async (item) => {
                    const teklifData: any =
                      item.data();

                    let ilanData: any = {};

                    if (teklifData.ilanId) {
                      try {
                        const ilanDoc =
                          await getDoc(
                            doc(
                              db,
                              "yukler",
                              String(
                                teklifData.ilanId
                              )
                            )
                          );

                        if (ilanDoc.exists()) {
                          ilanData =
                            ilanDoc.data();
                        }
                      } catch {
                        ilanData = {};
                      }
                    }

                    return {
                      id: item.id,

                      teklifTuru:
                        "normal" as TeklifTuru,

                      ...teklifData,

                      ilan: ilanData,
                    };
                  }
                )
              );

              setNormalTeklifler(
                liste
              );

              setNormalLoading(
                false
              );

              setHata("");
            } catch (error) {
              console.error(
                "Normal teklifler yükleme hatası:",
                error
              );

              setHata(
                "Normal tekliflerin yüklenirken bir hata oluştu."
              );

              setNormalLoading(
                false
              );
            }
          },

          (error) => {
            console.error(
              "Normal teklif snapshot hatası:",
              error
            );

            setHata(
              "Normal tekliflerin yüklenirken bir hata oluştu."
            );

            setNormalLoading(
              false
            );
          }
        );

        // ======================================
        // BOŞ ARAÇLARA GÖNDERDİĞİM
        // YÜK TEKLİFLERİ
        // ======================================

        const aracQuery = query(
          collection(
            db,
            "aracTeklifleri"
          ),
          where(
            "yukSahibiId",
            "==",
            user.uid
          )
        );

        unsubscribeArac = onSnapshot(
          aracQuery,

          async (snapshot) => {
            try {
              const liste = await Promise.all(
                snapshot.docs.map(
                  async (item) => {
                    const teklifData: any =
                      item.data();

                    let yukData: any = {};
                    let aracData: any = {};
                    let aracSahibiData: any =
                      {};

                    // YÜK
                    if (teklifData.yukId) {
                      try {
                        const yukDoc =
                          await getDoc(
                            doc(
                              db,
                              "yukler",
                              String(
                                teklifData.yukId
                              )
                            )
                          );

                        if (yukDoc.exists()) {
                          yukData =
                            yukDoc.data();
                        }
                      } catch {
                        yukData = {};
                      }
                    }

                    // ARAÇ
                    if (teklifData.aracId) {
                      try {
                        const aracDoc =
                          await getDoc(
                            doc(
                              db,
                              "araclar",
                              String(
                                teklifData.aracId
                              )
                            )
                          );

                        if (aracDoc.exists()) {
                          aracData =
                            aracDoc.data();
                        }
                      } catch {
                        aracData = {};
                      }
                    }

                    // ARAÇ SAHİBİ
                    if (
                      teklifData.aracSahibiId
                    ) {
                      try {
                        const kullaniciDoc =
                          await getDoc(
                            doc(
                              db,
                              "users",
                              String(
                                teklifData.aracSahibiId
                              )
                            )
                          );

                        if (
                          kullaniciDoc.exists()
                        ) {
                          aracSahibiData =
                            kullaniciDoc.data();
                        }
                      } catch {
                        aracSahibiData = {};
                      }
                    }

                    return {
                      id: item.id,

                      teklifTuru:
                        "arac" as TeklifTuru,

                      ...teklifData,

                      yuk: yukData,

                      arac: aracData,

                      aracSahibi:
                        aracSahibiData,
                    };
                  }
                )
              );

              setAracTeklifleri(
                liste
              );

              setAracLoading(
                false
              );
            } catch (error) {
              console.error(
                "Araç teklifleri yükleme hatası:",
                error
              );

              setHata(
                "Boş araçlara gönderdiğin yük teklifleri yüklenirken bir hata oluştu."
              );

              setAracLoading(
                false
              );
            }
          },

          (error) => {
            console.error(
              "Araç teklif snapshot hatası:",
              error
            );

            setHata(
              "Boş araçlara gönderdiğin yük teklifleri yüklenirken bir hata oluştu."
            );

            setAracLoading(
              false
            );
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeNormal) {
        unsubscribeNormal();
      }

      if (unsubscribeArac) {
        unsubscribeArac();
      }
    };
  }, [router]);

  // ==========================================
  // TÜM TEKLİFLER
  // ==========================================

  const teklifler = [
    ...normalTeklifler,
    ...aracTeklifleri,
  ].sort((a, b) => {
    const aTarih =
      a.createdAt?.seconds || 0;

    const bTarih =
      b.createdAt?.seconds || 0;

    return bTarih - aTarih;
  });

  const loading =
    normalLoading ||
    aracLoading;

  // ==========================================
  // PARA GÖSTER
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
  // DURUM
  // ==========================================

  function durumBilgisi(
    teklif: Teklif
  ) {
    if (
      teklif.durum ===
      "Kabul Edildi"
    ) {
      return {
        text:
          "✅ Kabul Edildi",

        className:
          "bg-green-100 text-green-700",
      };
    }

    if (
      teklif.durum ===
      "Reddedildi"
    ) {
      return {
        text:
          "❌ Reddedildi",

        className:
          "bg-red-100 text-red-700",
      };
    }

    return {
      text:
        "⏳ Bekliyor",

      className:
        "bg-yellow-100 text-yellow-700",
    };
  }

  // ==========================================
  // NORMAL TEKLİF EFEKTİF DURUM
  // ==========================================

  function normalTeklifBekliyorMu(
    teklif: Teklif
  ) {
    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      return false;
    }

    const ilanDurum =
      teklif.ilan?.durum;

    if (
      ilanDurum &&
      ilanDurum !== "Açık"
    ) {
      return false;
    }

    return true;
  }

  // ==========================================
  // ARAÇ TEKLİFİ EFEKTİF DURUM
  // ==========================================

  function aracTeklifiBekliyorMu(
    teklif: Teklif
  ) {
    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      return false;
    }

    const yukDurum =
      teklif.yuk?.durum;

    const aracDurum =
      teklif.arac?.durum;

    if (
      yukDurum &&
      yukDurum !== "Açık"
    ) {
      return false;
    }

    if (
      aracDurum &&
      aracDurum !== "Açık"
    ) {
      return false;
    }

    return true;
  }

  // ==========================================
  // EFEKTİF DURUM
  // ==========================================

  function efektifDurumBilgisi(
    teklif: Teklif
  ) {
    if (
      teklif.durum ===
      "Kabul Edildi"
    ) {
      return durumBilgisi(
        teklif
      );
    }

    if (
      teklif.durum ===
      "Reddedildi"
    ) {
      return durumBilgisi(
        teklif
      );
    }

    if (
      teklif.teklifTuru ===
      "normal"
    ) {
      if (
        !normalTeklifBekliyorMu(
          teklif
        )
      ) {
        return {
          text:
            "🔒 Sonuçlandı",

          className:
            "bg-gray-200 text-gray-700",
        };
      }
    }

    if (
      teklif.teklifTuru ===
      "arac"
    ) {
      if (
        !aracTeklifiBekliyorMu(
          teklif
        )
      ) {
        return {
          text:
            "🔒 Sonuçlandı",

          className:
            "bg-gray-200 text-gray-700",
        };
      }
    }

    return durumBilgisi(
      teklif
    );
  }

  // ==========================================
  // SOHBETE GİT
  // ==========================================

  function sohbeteGit(
    teklif: Teklif
  ) {
    const anlasmaId =
      teklif.anlasmaId ||
      teklif.ilanId ||
      teklif.yukId;

    if (!anlasmaId) {
      setHata(
        "Bu teklife ait anlaşma bilgisi bulunamadı."
      );

      return;
    }

    router.push(
      `/anlasmalarim/${anlasmaId}/sohbet`
    );
  }

  // ==========================================
  // NORMAL TEKLİF DÜZENLEME
  // ==========================================

  function teklifDuzenleAc(
    teklif: Teklif
  ) {
    setHata("");
    setBasari("");

    if (
      teklif.teklifTuru !==
      "normal"
    ) {
      setHata(
        "Boş araca gönderilen yük teklifi bu ekrandan güncellenemez."
      );

      return;
    }

    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      setHata(
        "Sadece bekleyen teklifler güncellenebilir."
      );

      return;
    }

    if (
      teklif.ilan?.durum &&
      teklif.ilan.durum !==
        "Açık"
    ) {
      setHata(
        "Bu ilan artık teklif güncellemesine açık değil."
      );

      return;
    }

    setDuzenlenenTeklif(
      teklif
    );

    setYeniFiyat(
      String(
        teklif.teklifFiyati ||
          teklif.fiyat ||
          ""
      )
    );

    setYeniMesaj(
      teklif.mesaj || ""
    );

    setYeniParaBirimi(
      teklif.paraBirimi ||
        "TRY"
    );
  }

  // ==========================================
  // NORMAL TEKLİFİ GÜNCELLE
  // ==========================================

  async function teklifGuncelle() {
    if (!duzenlenenTeklif) {
      return;
    }

    const currentUser =
      auth.currentUser;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setHata("");
    setBasari("");

    if (
      duzenlenenTeklif.teklifTuru !==
      "normal"
    ) {
      setHata(
        "Bu teklif türü güncellenemez."
      );

      return;
    }

    const fiyatSayisi =
      Number(yeniFiyat);

    if (
      yeniFiyat.trim() === "" ||
      Number.isNaN(
        fiyatSayisi
      ) ||
      fiyatSayisi <= 0
    ) {
      setHata(
        "Lütfen geçerli bir teklif fiyatı gir."
      );

      return;
    }

    try {
      setKaydediliyor(true);

      // ======================================
      // TEKLİFİ FIRESTORE'DAN SON KEZ OKU
      // ======================================

      const teklifRef =
        doc(
          db,
          "teklifler",
          duzenlenenTeklif.id
        );

      const teklifSnap =
        await getDoc(
          teklifRef
        );

      if (!teklifSnap.exists()) {
        setHata(
          "Teklif artık mevcut değil."
        );

        return;
      }

      const guncelTeklif: any = {
        id: teklifSnap.id,
        ...teklifSnap.data(),
      };

      if (
        guncelTeklif.nakliyeciId !==
        currentUser.uid
      ) {
        setHata(
          "Bu teklif sana ait değil."
        );

        return;
      }

      if (
        guncelTeklif.durum !==
        "Bekliyor"
      ) {
        setHata(
          "Bu teklif artık güncellenemez."
        );

        return;
      }

      if (!guncelTeklif.ilanId) {
        setHata(
          "Teklife ait yük ilanı bulunamadı."
        );

        return;
      }

      // ======================================
      // İLANI FIRESTORE'DAN SON KEZ OKU
      // ======================================

      const ilanSnap =
        await getDoc(
          doc(
            db,
            "yukler",
            String(
              guncelTeklif.ilanId
            )
          )
        );

      if (!ilanSnap.exists()) {
        setHata(
          "Yük ilanı artık mevcut değil."
        );

        return;
      }

      const guncelIlan: any =
        ilanSnap.data();

      if (
        guncelIlan.durum !==
        "Açık"
      ) {
        setHata(
          "Bu ilan artık teklif güncellemesine açık değil."
        );

        return;
      }

      // ======================================
      // GÜNCELLE
      // ======================================

      await updateDoc(
        teklifRef,
        {
          teklifFiyati:
            fiyatSayisi,

          fiyat:
            fiyatSayisi,

          paraBirimi:
            yeniParaBirimi,

          mesaj:
            yeniMesaj.trim(),

          guncellenmeTarihi:
            new Date().toISOString(),
        }
      );

      setDuzenlenenTeklif(
        null
      );

      setBasari(
        "Teklifin başarıyla güncellendi. ✅"
      );
    } catch (error: any) {
      console.error(
        "Teklif güncelleme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Firebase bu teklifin güncellenmesine izin vermedi."
        );
      } else {
        setHata(
          "Teklif güncellenirken bir hata oluştu."
        );
      }
    } finally {
      setKaydediliyor(
        false
      );
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-5xl mb-4">
            🚛
          </div>

          <p className="text-xl font-bold">
            Tekliflerin yükleniyor...
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
      <div className="max-w-5xl mx-auto">

        {/* BAŞLIK */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-green-600">
              🚛 Tekliflerim
            </h1>

            <p className="text-gray-500 mt-2">
              Yük ilanlarına verdiğin taşıma tekliflerini ve boş araçlara gönderdiğin yük tekliflerini buradan takip edebilirsin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                router.push(
                  "/ilanlar"
                );
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              🔎 Yük İlanlarını İncele
            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/bos-arac"
                );
              }}
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              🚛 Boş Araçları İncele
            </button>
          </div>
        </div>

        {/* ÖZET */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="font-extrabold text-blue-700">
              💰 Yük İlanlarına Verdiğim Teklifler
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {normalTeklifler.length}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <p className="font-extrabold text-orange-700">
              📦 Boş Araçlara Gönderdiğim Yükler
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {aracTeklifleri.length}
            </p>
          </div>
        </div>

        {/* HATA */}

        {hata !== "" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 font-bold">
            ⚠️ {hata}
          </div>
        )}

        {/* BAŞARI */}

        {basari !== "" && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6 font-bold">
            {basari}
          </div>
        )}

        {/* BOŞ */}

        {teklifler.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center">
            <div className="text-6xl">
              📭
            </div>

            <h2 className="text-2xl font-extrabold mt-5">
              Henüz teklif göndermedin
            </h2>

            <p className="text-gray-500 mt-3">
              Yük ilanlarına taşıma teklifi verebilir veya boş araçlara kendi yüklerinden birini teklif edebilirsin.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/ilanlar"
                  );
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold"
              >
                📦 Yük İlanları
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/bos-arac"
                  );
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-xl font-bold"
              >
                🚛 Boş Araçlar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {teklifler.map(
              (teklif) => {
                const durum =
                  efektifDurumBilgisi(
                    teklif
                  );

                const kabulEdildi =
                  teklif.durum ===
                  "Kabul Edildi";

                const reddedildi =
                  teklif.durum ===
                  "Reddedildi";

                // ==================================
                // NORMAL TEKLİF
                // ==================================

                if (
                  teklif.teklifTuru ===
                  "normal"
                ) {
                  const ilan =
                    teklif.ilan || {};

                  const bekliyor =
                    normalTeklifBekliyorMu(
                      teklif
                    );

                  const gercekDurumBekliyorAmaKapali =
                    teklif.durum ===
                      "Bekliyor" &&
                    !bekliyor;

                  const fiyat =
                    Number(
                      teklif.teklifFiyati ||
                        teklif.fiyat ||
                        0
                    );

                  const paraBirimi =
                    teklif.paraBirimi ||
                    "TRY";

                  return (
                    <div
                      key={
                        `normal_${teklif.id}`
                      }
                      className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border border-blue-100"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div>
                          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-extrabold mb-3">
                            💰 Yük İlanına Verdiğim Teklif
                          </span>

                          <h2 className="text-xl sm:text-2xl font-extrabold text-blue-700 break-words">
                            📍{" "}
                            {ilan.nereden ||
                              teklif.nereden ||
                              "Bilinmiyor"}{" "}
                            →{" "}
                            {ilan.nereye ||
                              teklif.nereye ||
                              "Bilinmiyor"}
                          </h2>

                          <div className="mt-4 space-y-2">
                            <p>
                              📦{" "}
                              <strong>
                                Yük:
                              </strong>{" "}
                              {ilan.yukTuru ||
                                teklif.yukTuru ||
                                "Belirtilmemiş"}
                            </p>

                            <p>
                              ⚖️{" "}
                              <strong>
                                Ağırlık:
                              </strong>{" "}
                              {ilan.agirlik ||
                                teklif.agirlik ||
                                "Belirtilmemiş"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-4 py-2 rounded-full font-bold self-start ${durum.className}`}
                        >
                          {durum.text}
                        </span>
                      </div>

                      {/* FİYAT */}

                      <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-5">
                        <p className="text-gray-600 font-semibold">
                          💰 Verdiğim Teklif
                        </p>

                        <p className="text-3xl font-extrabold text-green-600 mt-1">
                          {fiyatGoster(
                            fiyat,
                            paraBirimi
                          )}
                        </p>
                      </div>

                      {/* MESAJ */}

                      {teklif.mesaj && (
                        <div className="mt-5 bg-gray-50 rounded-2xl p-5">
                          <p className="font-extrabold">
                            📝 Gönderdiğim Mesaj
                          </p>

                          <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                            {teklif.mesaj}
                          </p>
                        </div>
                      )}

                      {/* BEKLİYOR */}

                      {bekliyor && (
                        <div className="mt-5">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                            <p className="text-yellow-700 font-extrabold">
                              ⏳ Teklif beklemede
                            </p>

                            <p className="text-yellow-700 mt-2">
                              Yük sahibi teklifini henüz değerlendirmedi.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              teklifDuzenleAc(
                                teklif
                              );
                            }}
                            className="mt-4 w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold"
                          >
                            ✏️ Teklifimi Güncelle
                          </button>
                        </div>
                      )}

                      {/* FIRESTORE'DA BEKLİYOR AMA İLAN KAPALI */}

                      {gercekDurumBekliyorAmaKapali && (
                        <div className="mt-5 bg-gray-100 border border-gray-200 rounded-2xl p-5">
                          <p className="text-gray-700 font-extrabold">
                            🔒 Bu teklif artık aktif değil
                          </p>

                          <p className="text-gray-600 mt-2">
                            Yük ilanı artık açık olmadığı için bu teklif üzerinde işlem yapılamaz.
                          </p>
                        </div>
                      )}

                      {/* KABUL */}

                      {kabulEdildi && (
                        <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-6">
                          <p className="text-green-700 font-extrabold text-xl">
                            🎉 Teklifin kabul edildi!
                          </p>

                          <p className="text-green-700 mt-2">
                            Yük sahibi teklifini kabul etti ve taşıma anlaşması oluşturuldu.
                          </p>

                          <div className="mt-5 flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                sohbeteGit(
                                  teklif
                                );
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-xl font-bold text-lg"
                            >
                              💬 Sohbete Git
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                router.push(
                                  "/anlasmalarim"
                                );
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-xl font-bold text-lg"
                            >
                              🤝 Anlaşmalarım
                            </button>
                          </div>
                        </div>
                      )}

                      {/* RED */}

                      {reddedildi && (
                        <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-5">
                          <p className="text-red-700 font-extrabold text-lg">
                            ❌ Teklif reddedildi
                          </p>

                          <p className="text-red-600 mt-2">
                            Bu teklif yük sahibi tarafından reddedildi veya yük için başka bir anlaşma yapıldı.
                          </p>
                        </div>
                      )}

                      {/* ALT BUTONLAR */}

                      <div className="mt-6 flex flex-col sm:flex-row gap-3">
                        {teklif.ilanId && (
                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                `/ilan/${teklif.ilanId}`
                              );
                            }}
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                          >
                            🔎 İlan Detayını Gör
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              "/ilanlar"
                            );
                          }}
                          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-5 py-3 rounded-xl font-bold"
                        >
                          🚛 Yeni Yüklere Bak
                        </button>
                      </div>
                    </div>
                  );
                }

                // ==================================
                // BOŞ ARACA GÖNDERDİĞİM
                // YÜK TEKLİFİ
                // ==================================

                const yuk =
                  teklif.yuk || {};

                const arac =
                  teklif.arac || {};

                const aracSahibi =
                  teklif.aracSahibi ||
                  {};

                const bekliyor =
                  aracTeklifiBekliyorMu(
                    teklif
                  );

                const gercekDurumBekliyorAmaKapali =
                  teklif.durum ===
                    "Bekliyor" &&
                  !bekliyor;

                const yukFiyati =
                  Number(
                    yuk.fiyat ||
                      teklif.yukFiyati ||
                      0
                  );

                const paraBirimi =
                  yuk.paraBirimi ||
                  teklif.paraBirimi ||
                  "TRY";

                const telefon =
                  aracSahibi.phone ||
                  aracSahibi.telefon ||
                  "";

                return (
                  <div
                    key={
                      `arac_${teklif.id}`
                    }
                    className="bg-white rounded-3xl shadow-xl p-5 sm:p-7 border-2 border-orange-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                      <div>
                        <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-extrabold mb-3">
                          📦 Boş Araca Gönderdiğim Yük Teklifi
                        </span>

                        <h2 className="text-xl sm:text-2xl font-extrabold text-orange-700 break-words">
                          📍{" "}
                          {yuk.nereden ||
                            teklif.nereden ||
                            "Bilinmiyor"}{" "}
                          →{" "}
                          {yuk.nereye ||
                            teklif.nereye ||
                            "Bilinmiyor"}
                        </h2>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full font-bold self-start ${durum.className}`}
                      >
                        {durum.text}
                      </span>
                    </div>

                    {/* GÖNDERDİĞİM YÜK */}

                    <div className="mt-5 bg-orange-50 border border-orange-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg text-orange-700">
                        📦 Gönderdiğim Yük
                      </p>

                      <div className="mt-3 space-y-2">
                        <p>
                          📦{" "}
                          <strong>
                            Yük Türü:
                          </strong>{" "}
                          {yuk.yukTuru ||
                            teklif.yukTuru ||
                            "Belirtilmemiş"}
                        </p>

                        <p>
                          ⚖️{" "}
                          <strong>
                            Ağırlık:
                          </strong>{" "}
                          {yuk.agirlik ||
                            teklif.agirlik ||
                            "Belirtilmemiş"}
                        </p>

                        <p>
                          💰{" "}
                          <strong>
                            Yük İlanı Fiyatı:
                          </strong>{" "}
                          <span className="font-extrabold text-green-600">
                            {fiyatGoster(
                              yukFiyati,
                              paraBirimi
                            )}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* TEKLİF GÖNDERİLEN ARAÇ */}

                    <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg text-green-700">
                        🚛 Teklif Gönderdiğim Araç
                      </p>

                      <div className="mt-3 space-y-2">
                        <p>
                          🚛{" "}
                          <strong>
                            Araç:
                          </strong>{" "}
                          {arac.aracTipi ||
                            teklif.aracTipi ||
                            "Belirtilmemiş"}
                        </p>

                        <p>
                          ⚖️{" "}
                          <strong>
                            Kapasite:
                          </strong>{" "}
                          {arac.kapasite ||
                            teklif.kapasite ||
                            "Belirtilmemiş"}
                        </p>

                        <p>
                          📍{" "}
                          {arac.bulunduguYer ||
                            teklif.aracBulunduguYer ||
                            "Bilinmiyor"}{" "}
                          →{" "}
                          {arac.gidecegiYer ||
                            teklif.aracGidecegiYer ||
                            "Bilinmiyor"}
                        </p>
                      </div>
                    </div>

                    {/* ARAÇ SAHİBİ */}

                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg">
                        👤 Araç Sahibi
                      </p>

                      <p className="mt-2">
                        <strong>
                          Ad Soyad:
                        </strong>{" "}
                        {aracSahibi.name ||
                          aracSahibi.adSoyad ||
                          "Belirtilmemiş"}
                      </p>

                      {telefon && (
                        <p className="mt-1">
                          📞{" "}
                          <strong>
                            Telefon:
                          </strong>{" "}
                          {telefon}
                        </p>
                      )}

                      {teklif.aracSahibiId && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/kullanici/${teklif.aracSahibiId}`
                            );
                          }}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          👤 Araç Sahibinin Profilini Gör
                        </button>
                      )}
                    </div>

                    {/* MESAJ */}

                    {teklif.mesaj && (
                      <div className="mt-5 bg-gray-50 rounded-2xl p-5">
                        <p className="font-extrabold">
                          📝 Gönderdiğim Mesaj
                        </p>

                        <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                          {teklif.mesaj}
                        </p>
                      </div>
                    )}

                    {/* BEKLİYOR */}

                    {bekliyor && (
                      <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                        <p className="text-yellow-700 font-extrabold">
                          ⏳ Yük teklifin beklemede
                        </p>

                        <p className="text-yellow-700 mt-2">
                          Araç sahibi gönderdiğin yük teklifini henüz değerlendirmedi.
                        </p>
                      </div>
                    )}

                    {/* ARTIK AKTİF DEĞİL */}

                    {gercekDurumBekliyorAmaKapali && (
                      <div className="mt-5 bg-gray-100 border border-gray-200 rounded-2xl p-5">
                        <p className="text-gray-700 font-extrabold">
                          🔒 Bu teklif artık aktif değil
                        </p>

                        <p className="text-gray-600 mt-2">
                          Yük veya boş araç artık açık olmadığı için bu teklif üzerinde işlem yapılamaz.
                        </p>
                      </div>
                    )}

                    {/* KABUL */}

                    {kabulEdildi && (
                      <div className="mt-5 bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-6">
                        <p className="text-green-700 font-extrabold text-xl">
                          🎉 Yük teklifin kabul edildi!
                        </p>

                        <p className="text-green-700 mt-2">
                          Araç sahibi yükünü kabul etti ve taşıma anlaşması oluşturuldu.
                        </p>

                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              sohbeteGit(
                                teklif
                              );
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-xl font-bold text-lg"
                          >
                            💬 Sohbete Git
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                "/anlasmalarim"
                              );
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-xl font-bold text-lg"
                          >
                            🤝 Anlaşmalarım
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RED */}

                    {reddedildi && (
                      <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-5">
                        <p className="text-red-700 font-extrabold text-lg">
                          ❌ Yük teklifin reddedildi
                        </p>

                        <p className="text-red-600 mt-2">
                          Araç sahibi yük teklifini reddetti veya araç başka bir yük için anlaşmaya vardı.
                        </p>
                      </div>
                    )}

                    {/* ALT BUTONLAR */}

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      {teklif.yukId && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/ilan/${teklif.yukId}`
                            );
                          }}
                          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          🔎 Yük İlanımı Gör
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            "/bos-arac"
                          );
                        }}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-5 py-3 rounded-xl font-bold"
                      >
                        🚛 Yeni Boş Araçlara Bak
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* ===================================== */}
      {/* NORMAL TEKLİF GÜNCELLEME MODALI */}
      {/* ===================================== */}

      {duzenlenenTeklif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8">

            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-orange-600">
                  ✏️ Teklifimi Güncelle
                </h2>

                <p className="text-gray-500 mt-2">
                  Fiyatını artırabilir veya azaltabilirsin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!kaydediliyor) {
                    setDuzenlenenTeklif(
                      null
                    );
                  }
                }}
                className="text-2xl font-bold text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 mt-7">

              <div>
                <label className="block font-bold mb-2">
                  💰 Yeni Teklif Fiyatı
                </label>

                <input
                  type="number"
                  min="1"
                  value={yeniFiyat}
                  onChange={(event) => {
                    setYeniFiyat(
                      event.currentTarget
                        .value
                    );
                  }}
                  placeholder="Örn: 25000"
                  className="w-full border rounded-xl p-4"
                />
              </div>

              <div>
                <label className="block font-bold mb-2">
                  💱 Para Birimi
                </label>

                <select
                  value={
                    yeniParaBirimi
                  }
                  onChange={(event) => {
                    setYeniParaBirimi(
                      event.currentTarget
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4 bg-white"
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
                  value={yeniMesaj}
                  onChange={(event) => {
                    setYeniMesaj(
                      event.currentTarget
                        .value
                    );
                  }}
                  rows={4}
                  placeholder="Yük sahibine mesajın..."
                  className="w-full border rounded-xl p-4"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={
                    kaydediliyor
                  }
                  onClick={() => {
                    setDuzenlenenTeklif(
                      null
                    );
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 py-4 rounded-xl font-bold"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  disabled={
                    kaydediliyor
                  }
                  onClick={
                    teklifGuncelle
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-extrabold"
                >
                  {kaydediliyor
                    ? "Kaydediliyor..."
                    : "💾 Teklifi Güncelle"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}