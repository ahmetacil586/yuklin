"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase";

export default function AnlasmalarimPage() {
  const router = useRouter();

  const [anlasmalar, setAnlasmalar] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [hata, setHata] =
    useState("");

  const [basari, setBasari] =
    useState("");

  const [
    islemYapiliyor,
    setIslemYapiliyor,
  ] = useState("");

  const [
    puanlar,
    setPuanlar,
  ] = useState<
    Record<string, number>
  >({});

  const [
    yorumlar,
    setYorumlar,
  ] = useState<
    Record<string, string>
  >({});

  const [
    degerlendirmeler,
    setDegerlendirmeler,
  ] = useState<
    Record<string, any>
  >({});

  const [
    degerlendirmeYukleniyor,
    setDegerlendirmeYukleniyor,
  ] = useState<
    Record<string, boolean>
  >({});

  // ==========================================
  // ANLAŞMALARI GETİR
  // ==========================================

  useEffect(() => {
    let unsubscribeSahip:
      | (() => void)
      | null = null;

    let unsubscribeNakliyeci:
      | (() => void)
      | null = null;

    let unsubscribeDegerlendirmeler:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {
          if (!user) {
            router.push(
              "/login"
            );

            return;
          }

          const aktifUserId =
            String(
              user.uid
            );

          let sahipAnlasmalari:
            any[] = [];

          let nakliyeciAnlasmalari:
            any[] = [];

          // ======================================
          // İKİ LİSTEYİ BİRLEŞTİR
          // ======================================

          function birlestir() {
            const map =
              new Map<
                string,
                any
              >();

            for (
              const item of
              sahipAnlasmalari
            ) {
              map.set(
                String(
                  item.id
                ),
                item
              );
            }

            for (
              const item of
              nakliyeciAnlasmalari
            ) {
              if (
                !map.has(
                  String(
                    item.id
                  )
                )
              ) {
                map.set(
                  String(
                    item.id
                  ),
                  item
                );
              }
            }

            const liste =
              Array.from(
                map.values()
              );

            liste.sort(
              (
                a: any,
                b: any
              ) => {
                const aTarih =
                  a.createdAt
                    ?.seconds ||
                  a.anlasmaTarihi
                    ?.seconds ||
                  0;

                const bTarih =
                  b.createdAt
                    ?.seconds ||
                  b.anlasmaTarihi
                    ?.seconds ||
                  0;

                return (
                  bTarih -
                  aTarih
                );
              }
            );

            setAnlasmalar(
              liste
            );

            setLoading(
              false
            );
          }

          // ======================================
          // ANLAŞMAYI ZENGİNLEŞTİR
          // ======================================

          async function anlasmaHazirla(
            id: string,
            data: any,
            benimRolum:
              | "yuk_sahibi"
              | "nakliyeci"
          ) {
            let ilanData: any =
              {};

            let teklifData: any =
              {};

            // ==================================
            // İLAN
            // ==================================

            const ilanId =
              String(
                data.ilanId ||
                id
              );

            try {
              const ilanSnap =
                await getDoc(
                  doc(
                    db,
                    "yukler",
                    ilanId
                  )
                );

              if (
                ilanSnap.exists()
              ) {
                ilanData = {
                  id:
                    ilanSnap.id,

                  ...ilanSnap.data(),
                };
              }
            } catch {
              ilanData = {};
            }

            // ==================================
            // TEKLİF
            // ==================================

            const teklifId =
              String(
                data.teklifId ||
                ilanData.kabulEdilenTeklifId ||
                ""
              );

            if (teklifId) {
              try {
                const teklifSnap =
                  await getDoc(
                    doc(
                      db,
                      "teklifler",
                      teklifId
                    )
                  );

                if (
                  teklifSnap.exists()
                ) {
                  teklifData = {
                    id:
                      teklifSnap.id,

                    ...teklifSnap.data(),
                  };
                }
              } catch {
                teklifData = {};
              }
            }

            const fiyat =
              Number(
                data.fiyat ||
                ilanData.kabulEdilenFiyat ||
                teklifData.teklifFiyati ||
                teklifData.fiyat ||
                0
              );

            const paraBirimi =
              String(
                data.paraBirimi ||
                ilanData.kabulEdilenParaBirimi ||
                teklifData.paraBirimi ||
                ilanData.paraBirimi ||
                "TRY"
              );

            const ilanSahibiId =
              String(
                data.ilanSahibiId ||
                ilanData.userId ||
                teklifData.ilanSahibiId ||
                ""
              );

            const nakliyeciId =
              String(
                data.nakliyeciId ||
                ilanData.kabulEdilenNakliyeciId ||
                teklifData.nakliyeciId ||
                ""
              );

            return {
              id,

              ...data,

              ilanId,

              teklifId,

              ilan:
                ilanData,

              teklif:
                teklifData,

              ilanSahibiId,

              nakliyeciId,

              benimRolum,

              nereden:
                data.nereden ||
                ilanData.nereden ||
                teklifData.nereden ||
                "",

              nereye:
                data.nereye ||
                ilanData.nereye ||
                teklifData.nereye ||
                "",

              yukTuru:
                data.yukTuru ||
                ilanData.yukTuru ||
                teklifData.yukTuru ||
                "",

              agirlik:
                data.agirlik ||
                ilanData.agirlik ||
                teklifData.agirlik ||
                "",

              anlasmaFiyati:
                fiyat,

              anlasmaParaBirimi:
                paraBirimi,

              yukSahibiTeslimOnayi:
                Boolean(
                  data.yukSahibiTeslimOnayi ||
                  ilanData.yukSahibiTeslimOnayi
                ),

              nakliyeciTeslimOnayi:
                Boolean(
                  data.nakliyeciTeslimOnayi ||
                  ilanData.nakliyeciTeslimOnayi
                ),

              durum:
                ilanData.durum ===
                "Tamamlandı"
                  ? "Tamamlandı"
                  : data.durum ===
                    "Tamamlandı"
                  ? "Tamamlandı"
                  : "Anlaşıldı",
            };
          }

          // ======================================
          // YÜK SAHİBİ ANLAŞMALARI
          // ======================================

          const sahipQuery =
            query(
              collection(
                db,
                "anlasmalar"
              ),
              where(
                "ilanSahibiId",
                "==",
                aktifUserId
              )
            );

          unsubscribeSahip =
            onSnapshot(
              sahipQuery,
              async (
                snapshot
              ) => {
                try {
                  sahipAnlasmalari =
                    await Promise.all(
                      snapshot.docs.map(
                        async (
                          item
                        ) => {
                          return anlasmaHazirla(
                            item.id,
                            item.data(),
                            "yuk_sahibi"
                          );
                        }
                      )
                    );

                  setHata(
                    ""
                  );

                  birlestir();
                } catch {
                  setHata(
                    "Yük sahibi anlaşmaları alınamadı."
                  );

                  setLoading(
                    false
                  );
                }
              },
              () => {
                setHata(
                  "Yük sahibi anlaşmaları alınamadı."
                );

                setLoading(
                  false
                );
              }
            );

          // ======================================
          // NAKLİYECİ ANLAŞMALARI
          // ======================================

          const nakliyeciQuery =
            query(
              collection(
                db,
                "anlasmalar"
              ),
              where(
                "nakliyeciId",
                "==",
                aktifUserId
              )
            );

          unsubscribeNakliyeci =
            onSnapshot(
              nakliyeciQuery,
              async (
                snapshot
              ) => {
                try {
                  nakliyeciAnlasmalari =
                    await Promise.all(
                      snapshot.docs.map(
                        async (
                          item
                        ) => {
                          return anlasmaHazirla(
                            item.id,
                            item.data(),
                            "nakliyeci"
                          );
                        }
                      )
                    );

                  setHata(
                    ""
                  );

                  birlestir();
                } catch {
                  setHata(
                    "Nakliyeci anlaşmaları alınamadı."
                  );

                  setLoading(
                    false
                  );
                }
              },
              () => {
                setHata(
                  "Nakliyeci anlaşmaları alınamadı."
                );

                setLoading(
                  false
                );
              }
            );

          // ======================================
          // BENİM DEĞERLENDİRMELERİM
          // ======================================

          const degerlendirmeQuery =
            query(
              collection(
                db,
                "degerlendirmeler"
              ),
              where(
                "degerlendirenId",
                "==",
                aktifUserId
              )
            );

          unsubscribeDegerlendirmeler =
            onSnapshot(
              degerlendirmeQuery,
              (
                snapshot
              ) => {
                const sonuc:
                  Record<
                    string,
                    any
                  > = {};

                snapshot.docs.forEach(
                  (
                    item
                  ) => {
                    const data =
                      item.data();

                    if (
                      data.anlasmaId
                    ) {
                      sonuc[
                        String(
                          data.anlasmaId
                        )
                      ] = {
                        id:
                          item.id,

                        ...data,
                      };
                    }
                  }
                );

                setDegerlendirmeler(
                  sonuc
                );
              },
              () => {
                // Sayfa çalışmaya devam etsin.
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (
        unsubscribeSahip
      ) {
        unsubscribeSahip();
      }

      if (
        unsubscribeNakliyeci
      ) {
        unsubscribeNakliyeci();
      }

      if (
        unsubscribeDegerlendirmeler
      ) {
        unsubscribeDegerlendirmeler();
      }
    };
  }, [router]);

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster(
    fiyat: number,
    paraBirimi: string
  ) {
    const sembol =
      paraBirimi ===
      "USD"
        ? "$"
        : paraBirimi ===
          "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      fiyat || 0
    ).toLocaleString(
      "tr-TR"
    )}`;
  }

  // ==========================================
  // TESLİMAT ONAYI
  // ==========================================

  async function tasimaOnayla(
    anlasma: any
  ) {
    const user =
      auth.currentUser;

    setHata("");
    setBasari("");

    if (!user) {
      setHata(
        "Önce giriş yapmalısın."
      );

      return;
    }

    if (
      anlasma.durum ===
      "Tamamlandı"
    ) {
      setHata(
        "Bu taşıma zaten tamamlandı."
      );

      return;
    }

    const benimRolum =
      anlasma.benimRolum;

    const yukSahibiOnay =
      Boolean(
        anlasma.yukSahibiTeslimOnayi
      );

    const nakliyeciOnay =
      Boolean(
        anlasma.nakliyeciTeslimOnayi
      );

    // ======================================
    // ÖNCEDEN ONAY VERMİŞ Mİ?
    // ======================================

    if (
      benimRolum ===
        "yuk_sahibi" &&
      yukSahibiOnay
    ) {
      setHata(
        "Teslim alma onayını zaten verdin."
      );

      return;
    }

    if (
      benimRolum ===
        "nakliyeci" &&
      nakliyeciOnay
    ) {
      setHata(
        "Teslim etme onayını zaten verdin."
      );

      return;
    }

    const soru =
      benimRolum ===
      "nakliyeci"
        ? "Yükü teslim ettiğini onaylıyor musun?"
        : "Yükü teslim aldığını onaylıyor musun?";

    const onay =
      (globalThis as any)
        .confirm?.(
          soru
        ) ?? false;

    if (!onay) {
      return;
    }

    try {
      setIslemYapiliyor(
        anlasma.id
      );

      const anlasmaRef =
        doc(
          db,
          "anlasmalar",
          anlasma.id
        );

      const ilanId =
        String(
          anlasma.ilanId ||
          anlasma.id
        );

      const ilanRef =
        doc(
          db,
          "yukler",
          ilanId
        );

      // ======================================
      // YÜK SAHİBİ TESLİM ALDI
      // ======================================

      if (
        benimRolum ===
        "yuk_sahibi"
      ) {
        // Nakliyeci zaten onayladıysa taşıma tamamlanır.
        if (
          nakliyeciOnay
        ) {
          const batch =
            writeBatch(
              db
            );

          batch.update(
            anlasmaRef,
            {
              yukSahibiTeslimOnayi:
                true,

              yukSahibiTeslimOnayTarihi:
                serverTimestamp(),

              durum:
                "Tamamlandı",

              tamamlanmaTarihi:
                serverTimestamp(),
            }
          );

          batch.update(
            ilanRef,
            {
              yukSahibiTeslimOnayi:
                true,

              yukSahibiTeslimOnayTarihi:
                serverTimestamp(),

              durum:
                "Tamamlandı",

              tamamlanmaTarihi:
                serverTimestamp(),
            }
          );

          await batch.commit();

          setBasari(
            "Taşıma tamamlandı! İki taraf da teslimatı onayladı. 🎉"
          );
        } else {
          const batch =
            writeBatch(
              db
            );

          batch.update(
            anlasmaRef,
            {
              yukSahibiTeslimOnayi:
                true,

              yukSahibiTeslimOnayTarihi:
                serverTimestamp(),
            }
          );

          batch.update(
            ilanRef,
            {
              yukSahibiTeslimOnayi:
                true,

              yukSahibiTeslimOnayTarihi:
                serverTimestamp(),
            }
          );

          await batch.commit();

          setBasari(
            "Teslim alma onayın kaydedildi. Nakliyecinin onayı bekleniyor. ✅"
          );
        }
      }

      // ======================================
      // NAKLİYECİ TESLİM ETTİ
      // ======================================

      if (
        benimRolum ===
        "nakliyeci"
      ) {
        // Yük sahibi zaten onayladıysa tamamlanır.
        if (
          yukSahibiOnay
        ) {
          const batch =
            writeBatch(
              db
            );

          batch.update(
            anlasmaRef,
            {
              nakliyeciTeslimOnayi:
                true,

              nakliyeciTeslimOnayTarihi:
                serverTimestamp(),

              durum:
                "Tamamlandı",

              tamamlanmaTarihi:
                serverTimestamp(),
            }
          );

          batch.update(
            ilanRef,
            {
              nakliyeciTeslimOnayi:
                true,

              nakliyeciTeslimOnayTarihi:
                serverTimestamp(),

              durum:
                "Tamamlandı",

              tamamlanmaTarihi:
                serverTimestamp(),
            }
          );

          await batch.commit();

          setBasari(
            "Taşıma tamamlandı! İki taraf da teslimatı onayladı. 🎉"
          );
        } else {
          const batch =
            writeBatch(
              db
            );

          batch.update(
            anlasmaRef,
            {
              nakliyeciTeslimOnayi:
                true,

              nakliyeciTeslimOnayTarihi:
                serverTimestamp(),
            }
          );

          batch.update(
            ilanRef,
            {
              nakliyeciTeslimOnayi:
                true,

              nakliyeciTeslimOnayTarihi:
                serverTimestamp(),
            }
          );

          await batch.commit();

          setBasari(
            "Teslim etme onayın kaydedildi. Yük sahibinin onayı bekleniyor. ✅"
          );
        }
      }
    } catch (error: any) {
      const kod =
        error?.code ||
        "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase teslimat güncellemesine izin vermedi (permission-denied)."
        );
      } else {
        setHata(
          "Teslimat onayı kaydedilirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // DEĞERLENDİRME GÖNDER
  // ==========================================

  async function degerlendirmeGonder(
    anlasma: any
  ) {
    const user =
      auth.currentUser;

    setHata("");
    setBasari("");

    if (!user) {
      setHata(
        "Değerlendirme yapmak için giriş yapmalısın."
      );

      return;
    }

    if (
      anlasma.durum !==
      "Tamamlandı"
    ) {
      setHata(
        "Sadece tamamlanan taşımalar değerlendirilebilir."
      );

      return;
    }

    if (
      degerlendirmeler[
        anlasma.id
      ]
    ) {
      setHata(
        "Bu taşıma için zaten değerlendirme yaptın."
      );

      return;
    }

    const puan =
      puanlar[
        anlasma.id
      ] || 0;

    const yorum =
      yorumlar[
        anlasma.id
      ]?.trim() ||
      "";

    if (
      puan < 1 ||
      puan > 5
    ) {
      setHata(
        "Lütfen 1 ile 5 arasında bir yıldız seç."
      );

      return;
    }

    let degerlendirilenId =
      "";

    // ======================================
    // KARŞI TARAF
    // ======================================

    if (
      anlasma.benimRolum ===
      "yuk_sahibi"
    ) {
      degerlendirilenId =
        String(
          anlasma.nakliyeciId ||
          ""
        );
    } else {
      degerlendirilenId =
        String(
          anlasma.ilanSahibiId ||
          ""
        );
    }

    if (
      !degerlendirilenId
    ) {
      setHata(
        "Değerlendirilecek kullanıcı bulunamadı."
      );

      return;
    }

    if (
      degerlendirilenId ===
      user.uid
    ) {
      setHata(
        "Kendini değerlendiremezsin."
      );

      return;
    }

    // Değerlendirme ID:
    // anlasmaId_userUid
    const degerlendirmeId =
      `${anlasma.id}_${user.uid}`;

    try {
      setDegerlendirmeYukleniyor(
        (
          onceki
        ) => ({
          ...onceki,

          [anlasma.id]:
            true,
        })
      );

      await setDoc(
        doc(
          db,
          "degerlendirmeler",
          degerlendirmeId
        ),
        {
          anlasmaId:
            String(
              anlasma.id
            ),

          degerlendirenId:
            String(
              user.uid
            ),

          degerlendirilenId:
            String(
              degerlendirilenId
            ),

          puan:
            Number(
              puan
            ),

          yorum:
            yorum,

          degerlendirenRol:
            anlasma.benimRolum,

          nereden:
            anlasma.nereden ||
            "",

          nereye:
            anlasma.nereye ||
            "",

          olusturulmaTarihi:
            serverTimestamp(),
        }
      );

      setDegerlendirmeler(
        (
          onceki
        ) => ({
          ...onceki,

          [anlasma.id]: {
            id:
              degerlendirmeId,

            anlasmaId:
              anlasma.id,

            degerlendirenId:
              user.uid,

            degerlendirilenId,

            puan,

            yorum,
          },
        })
      );

      setBasari(
        "Değerlendirmen başarıyla gönderildi. ⭐"
      );
    } catch (error: any) {
      const kod =
        error?.code ||
        "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase değerlendirmeye izin vermedi (permission-denied)."
        );
      } else {
        setHata(
          "Değerlendirme gönderilemedi. Lütfen tekrar dene."
        );
      }
    } finally {
      setDegerlendirmeYukleniyor(
        (
          onceki
        ) => ({
          ...onceki,

          [anlasma.id]:
            false,
        })
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
            🤝
          </div>

          <p className="text-xl font-bold">
            Anlaşmalar yükleniyor...
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-green-700">
              🤝 Anlaşmalarım
            </h1>

            <p className="text-gray-500 mt-2">
              Yük sahibi veya nakliyeci olarak yaptığın taşıma anlaşmalarını buradan takip edebilirsin.
            </p>

          </div>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/"
              );
            }}
            className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← Ana Sayfa
          </button>

        </div>

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
            ANLAŞMA YOK
        ====================================== */}

        {anlasmalar.length ===
        0 ? (

          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 text-center">

            <div className="text-6xl mb-5">
              🤝
            </div>

            <h2 className="text-2xl font-extrabold">
              Henüz anlaşman yok
            </h2>

            <p className="text-gray-500 mt-3">
              Bir teklif kabul edildiğinde anlaşman burada görünecek.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/ilanlar"
                );
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              🔎 Yük İlanlarını Gör
            </button>

          </div>

        ) : (

          <div className="space-y-6">

            {anlasmalar.map(
              (
                anlasma
              ) => {
                const tamamlandi =
                  anlasma.durum ===
                  "Tamamlandı";

                const yukSahibiOnay =
                  Boolean(
                    anlasma.yukSahibiTeslimOnayi
                  );

                const nakliyeciOnay =
                  Boolean(
                    anlasma.nakliyeciTeslimOnayi
                  );

                const benimOnayim =
                  anlasma.benimRolum ===
                  "nakliyeci"
                    ? nakliyeciOnay
                    : yukSahibiOnay;

                const degerlendirme =
                  degerlendirmeler[
                    anlasma.id
                  ];

                const seciliPuan =
                  puanlar[
                    anlasma.id
                  ] || 0;

                const degerlendirmeKaydediliyor =
                  Boolean(
                    degerlendirmeYukleniyor[
                      anlasma.id
                    ]
                  );

                // ==================================
                // KARŞI TARAF
                // ==================================

                const karsiTarafId =
                  anlasma.benimRolum ===
                  "yuk_sahibi"
                    ? String(
                        anlasma.nakliyeciId ||
                        ""
                      )
                    : String(
                        anlasma.ilanSahibiId ||
                        ""
                      );

                return (
                  <div
                    key={
                      anlasma.id
                    }
                    className="bg-white rounded-3xl shadow-xl p-5 sm:p-7"
                  >

                    {/* ==================================
                        ROL
                    ================================== */}

                    <div className="mb-5">

                      {anlasma.benimRolum ===
                      "nakliyeci" ? (

                        <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                          🚛 Nakliyeci Olarak
                        </span>

                      ) : (

                        <span className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold">
                          📦 Yük Sahibi Olarak
                        </span>

                      )}

                    </div>

                    {/* ==================================
                        ANLAŞMA BİLGİLERİ
                    ================================== */}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                      <div>

                        <h2 className="text-xl sm:text-2xl font-extrabold text-blue-700 break-words">
                          📍{" "}
                          {anlasma.nereden ||
                            "-"}{" "}
                          →{" "}
                          {anlasma.nereye ||
                            "-"}
                        </h2>

                        <div className="mt-5 space-y-3">

                          <p>
                            📦{" "}
                            <strong>
                              Yük:
                            </strong>{" "}
                            {anlasma.yukTuru ||
                              "-"}
                          </p>

                          <p>
                            ⚖️{" "}
                            <strong>
                              Ağırlık:
                            </strong>{" "}
                            {anlasma.agirlik ||
                              "-"}
                          </p>

                          <p>
                            💰{" "}
                            <strong>
                              Anlaşma Fiyatı:
                            </strong>{" "}

                            <span className="text-green-600 font-extrabold">
                              {fiyatGoster(
                                anlasma.anlasmaFiyati,
                                anlasma.anlasmaParaBirimi
                              )}
                            </span>
                          </p>

                        </div>

                      </div>

                      {tamamlandi ? (

                        <div className="bg-blue-100 text-blue-700 px-5 py-3 rounded-2xl font-extrabold self-start">
                          🏁 Tamamlandı
                        </div>

                      ) : (

                        <div className="bg-green-100 text-green-700 px-5 py-3 rounded-2xl font-extrabold self-start">
                          ✅ Anlaşıldı
                        </div>

                      )}

                    </div>

                    {/* ==================================
                        TESLİMAT DURUMU
                    ================================== */}

                    <div className="border-t mt-6 pt-6">

                      <h3 className="text-lg font-extrabold mb-4">
                        🚚 Teslimat Durumu
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-3">

                        <div
                          className={`rounded-2xl p-4 font-bold ${
                            nakliyeciOnay
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {nakliyeciOnay
                            ? "✅ Nakliyeci: Teslim Etti"
                            : "⏳ Nakliyeci: Teslim Onayı Bekleniyor"}
                        </div>

                        <div
                          className={`rounded-2xl p-4 font-bold ${
                            yukSahibiOnay
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-50 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {yukSahibiOnay
                            ? "✅ Yük Sahibi: Teslim Aldı"
                            : "⏳ Yük Sahibi: Teslim Onayı Bekleniyor"}
                        </div>

                      </div>

                      {/* BENİM ONAY BUTONUM */}

                      {!tamamlandi &&
                        !benimOnayim && (

                        <button
                          type="button"
                          disabled={
                            islemYapiliyor !==
                            ""
                          }
                          onClick={() => {
                            tasimaOnayla(
                              anlasma
                            );
                          }}
                          className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-extrabold text-lg"
                        >
                          {islemYapiliyor ===
                          anlasma.id
                            ? "⏳ Kaydediliyor..."
                            : anlasma.benimRolum ===
                              "nakliyeci"
                            ? "🚛 Teslim Ettim"
                            : "📦 Teslim Aldım"}
                        </button>

                      )}

                      {/* BEN ONAY VERDİM */}

                      {!tamamlandi &&
                        benimOnayim && (

                        <div className="mt-5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-2xl p-4 font-bold text-center">
                          ⏳ Sen onayını verdin. Diğer tarafın onayı bekleniyor.
                        </div>

                      )}

                      {/* TAMAMLANDI */}

                      {tamamlandi && (

                        <div className="mt-5 bg-green-50 border border-green-200 text-green-700 rounded-2xl p-5 text-center">

                          <div className="text-4xl mb-2">
                            🎉
                          </div>

                          <p className="text-xl font-extrabold">
                            Taşıma başarıyla tamamlandı
                          </p>

                          <p className="mt-2">
                            Yük sahibi ve nakliyeci teslimatı onayladı.
                          </p>

                        </div>

                      )}

                    </div>

                    {/* ==================================
                        DEĞERLENDİRME
                    ================================== */}

                    {tamamlandi && (

                      <div className="border-t mt-6 pt-6">

                        <h3 className="text-xl font-extrabold">
                          ⭐ Taşımayı Değerlendir
                        </h3>

                        <p className="text-gray-500 mt-2">
                          {anlasma.benimRolum ===
                          "yuk_sahibi"
                            ? "Bu taşıma için nakliyeciyi değerlendir."
                            : "Bu taşıma için yük sahibini değerlendir."}
                        </p>

                        {degerlendirme ? (

                          <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                              <div>

                                <p className="font-extrabold text-green-700">
                                  ✅ Değerlendirmen gönderildi
                                </p>

                                <div className="text-3xl mt-2">

                                  {[1, 2, 3, 4, 5].map(
                                    (
                                      yildiz
                                    ) => (

                                      <span
                                        key={
                                          yildiz
                                        }
                                        className={
                                          yildiz <=
                                          Number(
                                            degerlendirme.puan
                                          )
                                            ? ""
                                            : "opacity-25"
                                        }
                                      >
                                        ⭐
                                      </span>

                                    )
                                  )}

                                </div>

                              </div>

                              <div className="bg-white px-4 py-2 rounded-xl font-extrabold">
                                {degerlendirme.puan}/5
                              </div>

                            </div>

                            {degerlendirme.yorum && (

                              <div className="mt-4 bg-white rounded-xl p-4 text-gray-700">
                                📝{" "}
                                {
                                  degerlendirme.yorum
                                }
                              </div>

                            )}

                          </div>

                        ) : (

                          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-2xl p-5">

                            <p className="font-bold mb-3">
                              Puanın
                            </p>

                            <div className="flex flex-wrap gap-2">

                              {[1, 2, 3, 4, 5].map(
                                (
                                  yildiz
                                ) => (

                                  <button
                                    key={
                                      yildiz
                                    }
                                    type="button"
                                    onClick={() => {
                                      setPuanlar(
                                        (
                                          onceki
                                        ) => ({
                                          ...onceki,

                                          [anlasma.id]:
                                            yildiz,
                                        })
                                      );
                                    }}
                                    className={`text-4xl transition ${
                                      yildiz <=
                                      seciliPuan
                                        ? "opacity-100 scale-110"
                                        : "opacity-30 hover:opacity-70"
                                    }`}
                                  >
                                    ⭐
                                  </button>

                                )
                              )}

                            </div>

                            {seciliPuan >
                              0 && (

                              <p className="mt-3 font-bold text-yellow-600">
                                {
                                  seciliPuan
                                }
                                /5 yıldız seçtin
                              </p>

                            )}

                            <div className="mt-5">

                              <label className="block font-bold mb-2">
                                📝 Yorum
                              </label>

                              <textarea
                                value={
                                  yorumlar[
                                    anlasma.id
                                  ] || ""
                                }
                                onChange={(
                                  event
                                ) => {
                                  setYorumlar(
                                    (
                                      onceki
                                    ) => ({
                                      ...onceki,

                                      [anlasma.id]:
                                        (
                                          event.currentTarget as any
                                        ).value,
                                    })
                                  );
                                }}
                                maxLength={
                                  500
                                }
                                rows={
                                  4
                                }
                                placeholder={
                                  anlasma.benimRolum ===
                                  "yuk_sahibi"
                                    ? "Nakliyeciyle ilgili deneyimini yaz..."
                                    : "Yük sahibiyle ilgili deneyimini yaz..."
                                }
                                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 resize-none"
                              />

                              <p className="text-sm text-gray-400 mt-2 text-right">
                                {
                                  (
                                    yorumlar[
                                      anlasma.id
                                    ] ||
                                    ""
                                  ).length
                                }
                                /500
                              </p>

                            </div>

                            <button
                              type="button"
                              disabled={
                                degerlendirmeKaydediliyor ||
                                seciliPuan ===
                                  0
                              }
                              onClick={() => {
                                degerlendirmeGonder(
                                  anlasma
                                );
                              }}
                              className="w-full mt-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg"
                            >
                              {degerlendirmeKaydediliyor
                                ? "⏳ Değerlendirme gönderiliyor..."
                                : "⭐ Değerlendirmeyi Gönder"}
                            </button>

                          </div>

                        )}

                      </div>

                    )}

                    {/* ==================================
                        ALT BUTONLAR
                    ================================== */}

                    <div className="border-t mt-6 pt-6">

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                        {/* SOHBET */}

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/anlasmalarim/${anlasma.id}/sohbet`
                            );
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          💬 Sohbete Git
                        </button>

                        {/* İLAN */}

                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/ilan/${anlasma.ilanId || anlasma.id}`
                            );
                          }}
                          className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          🔎 İlan Detayını Gör
                        </button>

                        {/* PROFİL */}

                        <button
                          type="button"
                          disabled={
                            !karsiTarafId
                          }
                          onClick={() => {
                            if (
                              karsiTarafId
                            ) {
                              router.push(
                                `/kullanici/${karsiTarafId}`
                              );
                            }
                          }}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-bold sm:col-span-2 lg:col-span-1"
                        >
                          👤 Karşı Tarafın Profilini Gör
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

    </main>
  );
}