"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

export default function BenimIlanlarimPage() {
  const router = useRouter();

  const [ilanlar, setIlanlar] = useState<any[]>([]);
  const [teklifler, setTeklifler] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [islemYapiliyor, setIslemYapiliyor] = useState("");

  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");

  // ==========================================
  // DÜZENLEME
  // ==========================================

  const [duzenlenenIlan, setDuzenlenenIlan] =
    useState<any>(null);

  const [nereden, setNereden] = useState("");
  const [nereye, setNereye] = useState("");
  const [yukTuru, setYukTuru] = useState("");
  const [agirlik, setAgirlik] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [paraBirimi, setParaBirimi] =
    useState("TRY");
  const [aciklama, setAciklama] = useState("");

  // ==========================================
  // FIREBASE VERİLERİ
  // ==========================================

  useEffect(() => {
    let unsubscribeIlanlar: (() => void) | null = null;
    let unsubscribeTeklifler: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        // KENDİ İLANLARIM
        const ilanQuery = query(
          collection(db, "yukler"),
          where(
            "userId",
            "==",
            user.uid
          )
        );

        unsubscribeIlanlar = onSnapshot(
          ilanQuery,
          (snapshot) => {
            const liste =
              snapshot.docs.map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              );

            setIlanlar(liste);
            setLoading(false);
          },
          () => {
            setHata(
              "İlanların yüklenirken bir hata oluştu."
            );

            setLoading(false);
          }
        );

        // İLANLARIMA GELEN TEKLİFLER
        const teklifQuery = query(
          collection(db, "teklifler"),
          where(
            "ilanSahibiId",
            "==",
            user.uid
          )
        );

        unsubscribeTeklifler =
          onSnapshot(
            teklifQuery,
            (snapshot) => {
              const liste =
                snapshot.docs.map(
                  (item) => ({
                    id: item.id,
                    ...item.data(),
                  })
                );

              setTeklifler(liste);
            },
            () => {
              setHata(
                "Teklifler alınırken bir hata oluştu."
              );
            }
          );
      }
    );

    return () => {
      unsubscribeAuth();

      if (unsubscribeIlanlar) {
        unsubscribeIlanlar();
      }

      if (unsubscribeTeklifler) {
        unsubscribeTeklifler();
      }
    };
  }, [router]);

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster(teklif: any) {
    const sembol =
      teklif.paraBirimi === "USD"
        ? "$"
        : teklif.paraBirimi === "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      teklif.teklifFiyati ||
        teklif.fiyat ||
        0
    ).toLocaleString("tr-TR")}`;
  }

  function ilanFiyatGoster(ilan: any) {
    const sembol =
      ilan.paraBirimi === "USD"
        ? "$"
        : ilan.paraBirimi === "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      ilan.fiyat || 0
    ).toLocaleString("tr-TR")}`;
  }

  // ==========================================
  // İLANA AİT TEKLİFLER
  // ==========================================

  function ilanTeklifleri(
    ilanId: string
  ) {
    return teklifler.filter(
      (teklif) =>
        teklif.ilanId === ilanId
    );
  }

  // ==========================================
  // TEKLİF KABUL ET
  // ==========================================

  async function teklifKabulEt(
    teklif: any,
    ilan: any
  ) {
    if (islemYapiliyor) {
      return;
    }

    const onay =
      (globalThis as any).confirm?.(
        "Bu teklifi kabul etmek istediğine emin misin?"
      ) ?? false;

    if (!onay) {
      return;
    }

    setHata("");
    setBasari("");

    try {
      setIslemYapiliyor(
        teklif.id
      );

      const kabulEdilenFiyat =
        teklif.teklifFiyati ||
        teklif.fiyat ||
        0;

      // 1. TEKLİFİ KABUL ET
      await updateDoc(
        doc(
          db,
          "teklifler",
          teklif.id
        ),
        {
          durum: "Kabul Edildi",
        }
      );

      // 2. İLANI ANLAŞILDI YAP
      await updateDoc(
        doc(
          db,
          "yukler",
          ilan.id
        ),
        {
          durum: "Anlaşıldı",

          kabulEdilenTeklifId:
            teklif.id,

          kabulEdilenNakliyeciId:
            teklif.nakliyeciId,

          kabulEdilenFiyat:
            kabulEdilenFiyat,

          kabulEdilenParaBirimi:
            teklif.paraBirimi ||
            "TRY",
        }
      );

      // 3. ANLAŞMA KAYDI
      const anlasmaRef =
        await addDoc(
          collection(
            db,
            "anlasmalar"
          ),
          {
            ilanId:
              ilan.id,

            ilanSahibiId:
              ilan.userId,

            nakliyeciId:
              teklif.nakliyeciId,

            teklifId:
              teklif.id,

            nereden:
              ilan.nereden || "",

            nereye:
              ilan.nereye || "",

            yukTuru:
              ilan.yukTuru || "",

            agirlik:
              ilan.agirlik || "",

            fiyat:
              kabulEdilenFiyat,

            paraBirimi:
              teklif.paraBirimi ||
              "TRY",

            durum:
              "Aktif",

            olusturmaTarihi:
              new Date().toISOString(),
          }
        );

      // 4. TEKLİFE ANLAŞMA ID
      await updateDoc(
        doc(
          db,
          "teklifler",
          teklif.id
        ),
        {
          anlasmaId:
            anlasmaRef.id,
        }
      );

      // 5. İLANA ANLAŞMA ID
      await updateDoc(
        doc(
          db,
          "yukler",
          ilan.id
        ),
        {
          anlasmaId:
            anlasmaRef.id,
        }
      );

      // AYNI İLANDAKİ DİĞER
      // BEKLEYEN TEKLİFLERİ REDDET
      const digerTeklifler =
        teklifler.filter(
          (item) =>
            item.ilanId ===
              ilan.id &&
            item.id !==
              teklif.id &&
            item.durum ===
              "Bekliyor"
        );

      for (
        const digerTeklif of
          digerTeklifler
      ) {
        await updateDoc(
          doc(
            db,
            "teklifler",
            digerTeklif.id
          ),
          {
            durum:
              "Reddedildi",
          }
        );
      }

      setBasari(
        "Teklif kabul edildi ve taşıma anlaşması oluşturuldu. 🎉"
      );
    } catch {
      setHata(
        "Teklif kabul edilirken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor("");
    }
  }

  // ==========================================
  // TEKLİF REDDET
  // ==========================================

  async function teklifReddet(
    teklif: any
  ) {
    if (islemYapiliyor) {
      return;
    }

    const onay =
      (globalThis as any).confirm?.(
        "Bu teklifi reddetmek istediğine emin misin?"
      ) ?? false;

    if (!onay) {
      return;
    }

    setHata("");
    setBasari("");

    try {
      setIslemYapiliyor(
        teklif.id
      );

      await updateDoc(
        doc(
          db,
          "teklifler",
          teklif.id
        ),
        {
          durum:
            "Reddedildi",
        }
      );

      setBasari(
        "Teklif reddedildi."
      );
    } catch {
      setHata(
        "Teklif reddedilirken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor("");
    }
  }

  // ==========================================
  // İLAN DÜZENLEME MODALINI AÇ
  // ==========================================

  function duzenlemeAc(
    ilan: any
  ) {
    setHata("");
    setBasari("");

    if (
      ilan.durum ===
      "Anlaşıldı"
    ) {
      setHata(
        "Anlaşma sağlanan ilan artık düzenlenemez."
      );
      return;
    }

    setDuzenlenenIlan(ilan);

    setNereden(
      ilan.nereden || ""
    );

    setNereye(
      ilan.nereye || ""
    );

    setYukTuru(
      ilan.yukTuru || ""
    );

    setAgirlik(
      String(
        ilan.agirlik || ""
      )
    );

    setFiyat(
      String(
        ilan.fiyat || ""
      )
    );

    setParaBirimi(
      ilan.paraBirimi ||
        "TRY"
    );

    setAciklama(
      ilan.aciklama || ""
    );
  }

  // ==========================================
  // İLANI KAYDET
  // ==========================================

  async function ilanDuzenleKaydet() {
    if (
      !duzenlenenIlan
    ) {
      return;
    }

    if (
      duzenlenenIlan.durum ===
      "Anlaşıldı"
    ) {
      setHata(
        "Anlaşılmış ilan düzenlenemez."
      );
      return;
    }

    if (
      nereden.trim() === "" ||
      nereye.trim() === "" ||
      yukTuru.trim() === "" ||
      agirlik.trim() === ""
    ) {
      setHata(
        "Lütfen ilan bilgilerini eksiksiz doldur."
      );
      return;
    }

    const fiyatSayisi =
      Number(fiyat);

    if (
      Number.isNaN(
        fiyatSayisi
      ) ||
      fiyatSayisi < 0
    ) {
      setHata(
        "Geçerli bir fiyat gir."
      );
      return;
    }

    try {
      setIslemYapiliyor(
        duzenlenenIlan.id
      );

      setHata("");
      setBasari("");

      await updateDoc(
        doc(
          db,
          "yukler",
          duzenlenenIlan.id
        ),
        {
          nereden:
            nereden.trim(),

          nereye:
            nereye.trim(),

          yukTuru:
            yukTuru.trim(),

          agirlik:
            agirlik.trim(),

          fiyat:
            fiyatSayisi,

          paraBirimi:
            paraBirimi,

          aciklama:
            aciklama.trim(),
        }
      );

      setDuzenlenenIlan(
        null
      );

      setBasari(
        "İlan başarıyla güncellendi. ✅"
      );
    } catch {
      setHata(
        "İlan güncellenirken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor("");
    }
  }

  // ==========================================
  // İLAN KAPAT / AÇ
  // ==========================================

  async function ilanDurumDegistir(
    ilan: any
  ) {
    if (
      islemYapiliyor
    ) {
      return;
    }

    if (
      ilan.durum ===
      "Anlaşıldı"
    ) {
      setHata(
        "Anlaşma sağlanan ilan kapatılamaz veya yeniden açılamaz."
      );
      return;
    }

    const yeniDurum =
      ilan.durum ===
      "Kapalı"
        ? "Açık"
        : "Kapalı";

    const mesaj =
      yeniDurum ===
      "Kapalı"
        ? "İlanı kapatmak istediğine emin misin?"
        : "İlanı tekrar açmak istediğine emin misin?";

    const onay =
      (globalThis as any).confirm?.(
        mesaj
      ) ?? false;

    if (!onay) {
      return;
    }

    try {
      setIslemYapiliyor(
        ilan.id
      );

      setHata("");
      setBasari("");

      await updateDoc(
        doc(
          db,
          "yukler",
          ilan.id
        ),
        {
          durum:
            yeniDurum,
        }
      );

      setBasari(
        yeniDurum ===
          "Kapalı"
          ? "İlan kapatıldı. 🔒"
          : "İlan tekrar açıldı. 🟢"
      );
    } catch {
      setHata(
        "İlan durumu değiştirilemedi."
      );
    } finally {
      setIslemYapiliyor("");
    }
  }

  // ==========================================
  // İLAN SİL
  // ==========================================

  async function ilanSil(
    ilan: any
  ) {
    if (
      islemYapiliyor
    ) {
      return;
    }

    if (
      ilan.durum ===
      "Anlaşıldı"
    ) {
      setHata(
        "Anlaşma sağlanan ilan silinemez."
      );
      return;
    }

    const buIlaninTeklifleri =
      ilanTeklifleri(
        ilan.id
      );

    if (
      buIlaninTeklifleri.length >
      0
    ) {
      setHata(
        "Bu ilana teklif geldiği için ilanı silemezsin. İstersen ilanı kapatabilirsin."
      );
      return;
    }

    const onay =
      (globalThis as any).confirm?.(
        "Bu ilanı kalıcı olarak silmek istediğine emin misin?"
      ) ?? false;

    if (!onay) {
      return;
    }

    try {
      setIslemYapiliyor(
        ilan.id
      );

      setHata("");
      setBasari("");

      await deleteDoc(
        doc(
          db,
          "yukler",
          ilan.id
        )
      );

      setBasari(
        "İlan silindi. 🗑️"
      );
    } catch {
      setHata(
        "İlan silinirken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor("");
    }
  }

  // ==========================================
  // YÜKLENİYOR
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

          <div className="text-5xl mb-4">
            📦
          </div>

          <p className="text-xl font-bold">
            İlanların yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">

      <div className="max-w-6xl mx-auto">

        {/* ==========================================
            BAŞLIK
        ========================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-4xl font-extrabold text-blue-700">
              📦 Benim İlanlarım
            </h1>

            <p className="text-gray-500 mt-2">
              İlanlarını ve gelen teklifleri buradan yönet.
            </p>

          </div>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/yuk-ver"
              );
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            ➕ Yeni İlan Ver
          </button>

        </div>

        {/* HATA */}

        {hata !== "" && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold">
            ⚠️ {hata}
          </div>
        )}

        {/* BAŞARI */}

        {basari !== "" && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 font-bold">
            {basari}
          </div>
        )}

        {/* ==========================================
            İLAN YOK
        ========================================== */}

        {ilanlar.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

            <div className="text-6xl">
              📦
            </div>

            <h2 className="text-2xl font-extrabold mt-5">
              Henüz ilan vermedin
            </h2>

            <p className="text-gray-500 mt-3">
              İlk yük ilanını oluştur ve teklif almaya başla.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/yuk-ver"
                );
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold"
            >
              📦 İlk İlanımı Ver
            </button>

          </div>

        ) : (

          <div className="space-y-8">

            {ilanlar.map(
              (ilan) => {
                const ilanTeklifListesi =
                  ilanTeklifleri(
                    ilan.id
                  );

                const anlasildi =
                  ilan.durum ===
                  "Anlaşıldı";

                const kapali =
                  ilan.durum ===
                  "Kapalı";

                return (
                  <div
                    key={ilan.id}
                    className="bg-white rounded-3xl shadow-xl p-7"
                  >

                    {/* ==========================================
                        İLAN ÜST
                    ========================================== */}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                      <div>

                        <h2 className="text-2xl font-extrabold text-blue-700">
                          📍{" "}
                          {ilan.nereden ||
                            "-"}{" "}
                          →{" "}
                          {ilan.nereye ||
                            "-"}
                        </h2>

                        <div className="mt-4 space-y-2">

                          <p>
                            📦{" "}
                            <strong>
                              Yük:
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
                              İlan Fiyatı:
                            </strong>{" "}
                            {ilanFiyatGoster(
                              ilan
                            )}
                          </p>

                        </div>

                      </div>

                      <span
                        className={`px-4 py-2 rounded-full font-bold self-start ${
                          anlasildi
                            ? "bg-green-100 text-green-700"
                            : kapali
                            ? "bg-gray-200 text-gray-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {anlasildi
                          ? "✅ Anlaşıldı"
                          : kapali
                          ? "🔒 Kapalı"
                          : "🟢 Açık"}
                      </span>

                    </div>

                    {/* ==========================================
                        İLAN YÖNETİMİ
                    ========================================== */}

                    {!anlasildi && (

                      <div className="mt-6 bg-gray-50 rounded-2xl p-4">

                        <p className="font-extrabold mb-3">
                          ⚙️ İlan Yönetimi
                        </p>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-3">

                          <button
                            type="button"
                            onClick={() => {
                              duzenlemeAc(
                                ilan
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-bold"
                          >
                            ✏️ Düzenle
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              ilanDurumDegistir(
                                ilan
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-bold"
                          >
                            {kapali
                              ? "🟢 Tekrar Aç"
                              : "🔒 İlanı Kapat"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              ilanSil(
                                ilan
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-3 rounded-xl font-bold"
                          >
                            🗑️ İlanı Sil
                          </button>

                        </div>

                      </div>

                    )}

                    {anlasildi && (

                      <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4">

                        <p className="text-green-700 font-bold">
                          🤝 Bu ilan için taşıma anlaşması oluşturuldu.
                        </p>

                        <p className="text-green-600 text-sm mt-1">
                          Anlaşma sağlanan ilan düzenlenemez, kapatılamaz veya silinemez.
                        </p>

                      </div>

                    )}

                    {/* ==========================================
                        GELEN TEKLİFLER
                    ========================================== */}

                    <div className="border-t mt-6 pt-6">

                      <div className="flex items-center justify-between mb-5">

                        <h3 className="text-xl font-extrabold">
                          💰 Gelen Teklifler
                        </h3>

                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                          {
                            ilanTeklifListesi.length
                          }{" "}
                          teklif
                        </span>

                      </div>

                      {ilanTeklifListesi.length ===
                      0 ? (

                        <div className="bg-gray-50 rounded-2xl p-6 text-center">

                          <div className="text-4xl">
                            📭
                          </div>

                          <p className="font-bold mt-2">
                            Henüz teklif gelmedi.
                          </p>

                          <p className="text-gray-500 text-sm mt-1">
                            Nakliyeciler teklif verdiğinde burada görünecek.
                          </p>

                        </div>

                      ) : (

                        <div className="space-y-4">

                          {ilanTeklifListesi.map(
                            (teklif) => (

                              <div
                                key={
                                  teklif.id
                                }
                                className="border rounded-2xl p-5"
                              >

                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                  <div>

                                    <p className="text-2xl font-extrabold text-green-600">
                                      💰{" "}
                                      {fiyatGoster(
                                        teklif
                                      )}
                                    </p>

                                    <p className="mt-2">
                                      📦{" "}
                                      <strong>
                                        Yük:
                                      </strong>{" "}
                                      {teklif.yukTuru ||
                                        ilan.yukTuru ||
                                        "-"}
                                    </p>

                                    {teklif.mesaj && (

                                      <div className="bg-gray-50 rounded-xl p-3 mt-3">

                                        <p className="font-bold">
                                          📝 Mesaj
                                        </p>

                                        <p className="text-gray-600 mt-1">
                                          {
                                            teklif.mesaj
                                          }
                                        </p>

                                      </div>

                                    )}

                                  </div>

                                  <div className="flex flex-col gap-2">

                                    <span
                                      className={`text-center px-4 py-2 rounded-full font-bold ${
                                        teklif.durum ===
                                        "Kabul Edildi"
                                          ? "bg-green-100 text-green-700"
                                          : teklif.durum ===
                                            "Reddedildi"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-yellow-100 text-yellow-700"
                                      }`}
                                    >
                                      {teklif.durum ===
                                      "Kabul Edildi"
                                        ? "✅ Kabul Edildi"
                                        : teklif.durum ===
                                          "Reddedildi"
                                        ? "❌ Reddedildi"
                                        : "⏳ Bekliyor"}
                                    </span>

                                    {teklif.durum ===
                                      "Bekliyor" &&
                                      !anlasildi &&
                                      !kapali && (

                                        <div className="flex flex-col sm:flex-row gap-2">

                                          <button
                                            type="button"
                                            onClick={() => {
                                              teklifKabulEt(
                                                teklif,
                                                ilan
                                              );
                                            }}
                                            disabled={
                                              islemYapiliyor !==
                                              ""
                                            }
                                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-bold"
                                          >
                                            {islemYapiliyor ===
                                            teklif.id
                                              ? "⏳ İşleniyor..."
                                              : "✅ Kabul Et"}
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              teklifReddet(
                                                teklif
                                              );
                                            }}
                                            disabled={
                                              islemYapiliyor !==
                                              ""
                                            }
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-bold"
                                          >
                                            ❌ Reddet
                                          </button>

                                        </div>

                                      )}

                                  </div>

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                    {/* ==========================================
                        ALT BUTONLAR
                    ========================================== */}

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">

                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/ilan/${ilan.id}`
                          );
                        }}
                        className="flex-1 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                      >
                        🔎 İlan Detayını Gör
                      </button>

                      {anlasildi && (

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/anlasmalarim/${ilan.id}/sohbet`
                            );
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          💬 Sohbete Git
                        </button>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ==========================================
          İLAN DÜZENLEME MODALI
      ========================================== */}

      {duzenlenenIlan && (

        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">

            <div className="flex items-center justify-between gap-4 mb-6">

              <div>

                <h2 className="text-2xl font-extrabold text-blue-700">
                  ✏️ İlanı Düzenle
                </h2>

                <p className="text-gray-500 mt-1">
                  İlan bilgilerini güncelle.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !islemYapiliyor
                  ) {
                    setDuzenlenenIlan(
                      null
                    );
                  }
                }}
                className="text-2xl font-bold text-gray-500"
              >
                ✕
              </button>

            </div>

            <div className="space-y-5">

              <div>

                <label className="block font-bold mb-2">
                  📍 Nereden?
                </label>

                <input
                  type="text"
                  value={nereden}
                  onChange={(event) => {
                    setNereden(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4"
                />

              </div>

              <div>

                <label className="block font-bold mb-2">
                  📍 Nereye?
                </label>

                <input
                  type="text"
                  value={nereye}
                  onChange={(event) => {
                    setNereye(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4"
                />

              </div>

              <div>

                <label className="block font-bold mb-2">
                  📦 Yük Türü
                </label>

                <input
                  type="text"
                  value={yukTuru}
                  onChange={(event) => {
                    setYukTuru(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4"
                />

              </div>

              <div>

                <label className="block font-bold mb-2">
                  ⚖️ Ağırlık
                </label>

                <input
                  type="text"
                  value={agirlik}
                  onChange={(event) => {
                    setAgirlik(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4"
                />

              </div>

              <div>

                <label className="block font-bold mb-2">
                  💰 Fiyat
                </label>

                <input
                  type="number"
                  value={fiyat}
                  onChange={(event) => {
                    setFiyat(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  className="w-full border rounded-xl p-4"
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
                      (event.currentTarget as any)
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
                  📝 Açıklama
                </label>

                <textarea
                  value={aciklama}
                  onChange={(event) => {
                    setAciklama(
                      (event.currentTarget as any)
                        .value
                    );
                  }}
                  rows={4}
                  className="w-full border rounded-xl p-4"
                />

              </div>

              <div className="flex flex-col sm:flex-row gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setDuzenlenenIlan(
                      null
                    );
                  }}
                  disabled={
                    islemYapiliyor !==
                    ""
                  }
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 rounded-xl font-bold"
                >
                  Vazgeç
                </button>

                <button
                  type="button"
                  onClick={
                    ilanDuzenleKaydet
                  }
                  disabled={
                    islemYapiliyor !==
                    ""
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-extrabold"
                >
                  {islemYapiliyor
                    ? "Kaydediliyor..."
                    : "💾 Değişiklikleri Kaydet"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}