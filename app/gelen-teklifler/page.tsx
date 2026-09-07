"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  reload,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db } from "../firebase";

type TeklifTuru = "normal" | "arac";

type GelenTeklif = {
  id: string;
  teklifTuru: TeklifTuru;

  durum: string;
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
  nakliyeci?: any;

  // ARAÇ TEKLİFİ
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
  yukSahibi?: any;
  arac?: any;
};

export default function GelenTekliflerPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [normalTeklifler, setNormalTeklifler] =
    useState<GelenTeklif[]>([]);

  const [aracTeklifleri, setAracTeklifleri] =
    useState<GelenTeklif[]>([]);

  const [normalYukleniyor, setNormalYukleniyor] =
    useState(true);

  const [aracYukleniyor, setAracYukleniyor] =
    useState(true);

  const [islemYapiliyor, setIslemYapiliyor] =
    useState("");

  const [hata, setHata] =
    useState("");

  const [basari, setBasari] =
    useState("");

  // ==========================================
  // KULLANICI + GELEN TEKLİFLER
  // ==========================================

  useEffect(() => {
    let unsubscribeNormal:
      | (() => void)
      | null = null;

    let unsubscribeArac:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            setUser(null);
            router.push("/login");
            return;
          }

          try {
            await reload(currentUser);
            await currentUser.getIdToken(true);
          } catch {
            // Kullanıcı oturumu kullanılmaya devam eder.
          }

          const guncelUser =
            auth.currentUser || currentUser;

          setUser(guncelUser);

          // ======================================
          // YÜK İLANLARIMA GELEN NORMAL TEKLİFLER
          // ======================================

          const normalQuery =
            query(
              collection(
                db,
                "teklifler"
              ),
              where(
                "ilanSahibiId",
                "==",
                guncelUser.uid
              )
            );

          unsubscribeNormal =
            onSnapshot(
              normalQuery,
              async (snapshot) => {
                try {
                  const liste =
                    await Promise.all(
                      snapshot.docs.map(
                        async (item) => {
                          const teklifData: any =
                            item.data();

                          let ilanData: any = {};
                          let teklifVerenData: any = {};

                          // İLAN
                          if (teklifData.ilanId) {
                            try {
                              const ilanSnap =
                                await getDoc(
                                  doc(
                                    db,
                                    "yukler",
                                    String(
                                      teklifData.ilanId
                                    )
                                  )
                                );

                              if (ilanSnap.exists()) {
                                ilanData =
                                  ilanSnap.data();
                              }
                            } catch {
                              ilanData = {};
                            }
                          }

                          // TEKLİF VEREN
                          if (
                            teklifData.nakliyeciId
                          ) {
                            try {
                              const kullaniciSnap =
                                await getDoc(
                                  doc(
                                    db,
                                    "users",
                                    String(
                                      teklifData.nakliyeciId
                                    )
                                  )
                                );

                              if (
                                kullaniciSnap.exists()
                              ) {
                                teklifVerenData =
                                  kullaniciSnap.data();
                              }
                            } catch {
                              teklifVerenData = {};
                            }
                          }

                          return {
                            id: item.id,

                            teklifTuru:
                              "normal" as TeklifTuru,

                            ...teklifData,

                            ilan:
                              ilanData,

                            nakliyeci:
                              teklifVerenData,
                          };
                        }
                      )
                    );

                  liste.sort(
                    (a: any, b: any) => {
                      const aTarih =
                        a.createdAt?.seconds || 0;

                      const bTarih =
                        b.createdAt?.seconds || 0;

                      return bTarih - aTarih;
                    }
                  );

                  setNormalTeklifler(
                    liste
                  );

                  setNormalYukleniyor(
                    false
                  );
                } catch {
                  setHata(
                    "Normal teklifler yüklenemedi."
                  );

                  setNormalYukleniyor(
                    false
                  );
                }
              },

              () => {
                setHata(
                  "Normal teklifler yüklenemedi."
                );

                setNormalYukleniyor(
                  false
                );
              }
            );

          // ======================================
          // BOŞ ARAÇLARIMA GELEN YÜK TEKLİFLERİ
          // ======================================

          const aracQuery =
            query(
              collection(
                db,
                "aracTeklifleri"
              ),
              where(
                "aracSahibiId",
                "==",
                guncelUser.uid
              )
            );

          unsubscribeArac =
            onSnapshot(
              aracQuery,
              async (snapshot) => {
                try {
                  const liste =
                    await Promise.all(
                      snapshot.docs.map(
                        async (item) => {
                          const teklifData: any =
                            item.data();

                          let yukData: any = {};
                          let yukSahibiData: any = {};
                          let aracData: any = {};

                          // YÜK
                          if (teklifData.yukId) {
                            try {
                              const yukSnap =
                                await getDoc(
                                  doc(
                                    db,
                                    "yukler",
                                    String(
                                      teklifData.yukId
                                    )
                                  )
                                );

                              if (yukSnap.exists()) {
                                yukData =
                                  yukSnap.data();
                              }
                            } catch {
                              yukData = {};
                            }
                          }

                          // YÜK SAHİBİ
                          if (
                            teklifData.yukSahibiId
                          ) {
                            try {
                              const kullaniciSnap =
                                await getDoc(
                                  doc(
                                    db,
                                    "users",
                                    String(
                                      teklifData.yukSahibiId
                                    )
                                  )
                                );

                              if (
                                kullaniciSnap.exists()
                              ) {
                                yukSahibiData =
                                  kullaniciSnap.data();
                              }
                            } catch {
                              yukSahibiData = {};
                            }
                          }

                          // ARAÇ
                          if (teklifData.aracId) {
                            try {
                              const aracSnap =
                                await getDoc(
                                  doc(
                                    db,
                                    "araclar",
                                    String(
                                      teklifData.aracId
                                    )
                                  )
                                );

                              if (aracSnap.exists()) {
                                aracData =
                                  aracSnap.data();
                              }
                            } catch {
                              aracData = {};
                            }
                          }

                          return {
                            id: item.id,

                            teklifTuru:
                              "arac" as TeklifTuru,

                            ...teklifData,

                            yuk:
                              yukData,

                            yukSahibi:
                              yukSahibiData,

                            arac:
                              aracData,
                          };
                        }
                      )
                    );

                  liste.sort(
                    (a: any, b: any) => {
                      const aTarih =
                        a.createdAt?.seconds || 0;

                      const bTarih =
                        b.createdAt?.seconds || 0;

                      return bTarih - aTarih;
                    }
                  );

                  setAracTeklifleri(
                    liste
                  );

                  setAracYukleniyor(
                    false
                  );
                } catch {
                  setHata(
                    "Araçlarına gelen yük teklifleri yüklenemedi."
                  );

                  setAracYukleniyor(
                    false
                  );
                }
              },

              () => {
                setHata(
                  "Araçlarına gelen yük teklifleri yüklenemedi."
                );

                setAracYukleniyor(
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
  ].sort((a: any, b: any) => {
    const aTarih =
      a.createdAt?.seconds || 0;

    const bTarih =
      b.createdAt?.seconds || 0;

    return bTarih - aTarih;
  });

  const loading =
    normalYukleniyor ||
    aracYukleniyor;

  // ==========================================
  // FİYAT
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
  // BİLDİRİM
  // ==========================================

  async function bildirimOlustur({
    kullaniciId,
    baslik,
    mesaj,
    tip,
    hedef,
  }: {
    kullaniciId: string;
    baslik: string;
    mesaj: string;
    tip: string;
    hedef: string;
  }) {
    if (!kullaniciId) {
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "bildirimler"
        ),
        {
          kullaniciId,
          baslik,
          mesaj,
          tip,
          hedef,
          okundu: false,

          createdAt:
            serverTimestamp(),
        }
      );
    } catch {
      // Bildirim hatası ana işlemi bozmaz.
    }
  }

  // ==========================================
  // NORMAL TEKLİFİ KABUL ET
  // ==========================================

  async function normalTeklifKabulEt(
    teklif: GelenTeklif
  ) {
    if (islemYapiliyor) {
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
      teklif.ilanSahibiId !==
      currentUser.uid
    ) {
      setHata(
        "Bu teklifi kabul etme yetkin yok."
      );
      return;
    }

    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      setHata(
        "Bu teklif artık beklemede değil."
      );
      return;
    }

    if (!teklif.ilanId) {
      setHata(
        "Teklife ait yük ilanı bulunamadı."
      );
      return;
    }

    const onay =
      globalThis.confirm(
        "Bu teklifi kabul etmek istediğine emin misin? Aynı yüke ait diğer bekleyen teklifler kapatılacak."
      );

    if (!onay) {
      return;
    }

    setIslemYapiliyor(
      `normal_${teklif.id}`
    );

    try {
      // ======================================
      // İLANI SON KEZ OKU
      // ======================================

      const ilanRef =
        doc(
          db,
          "yukler",
          String(
            teklif.ilanId
          )
        );

      const ilanSnap =
        await getDoc(
          ilanRef
        );

      if (!ilanSnap.exists()) {
        setHata(
          "Yük ilanı artık mevcut değil."
        );
        return;
      }

      const guncelIlan: any = {
        id: ilanSnap.id,
        ...ilanSnap.data(),
      };

      if (
        guncelIlan.userId !==
        currentUser.uid
      ) {
        setHata(
          "Bu yük ilanı sana ait değil."
        );
        return;
      }

      if (
        guncelIlan.durum !==
        "Açık"
      ) {
        setHata(
          "Bu yük ilanı artık teklif kabul etmiyor."
        );
        return;
      }

      // ======================================
      // TEKLİFİ SON KEZ OKU
      // ======================================

      const teklifRef =
        doc(
          db,
          "teklifler",
          teklif.id
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
        guncelTeklif.durum !==
        "Bekliyor"
      ) {
        setHata(
          "Bu teklif artık beklemede değil."
        );
        return;
      }

      if (
        guncelTeklif.ilanSahibiId !==
        currentUser.uid
      ) {
        setHata(
          "Bu teklifi kabul etme yetkin yok."
        );
        return;
      }

      if (
        String(
          guncelTeklif.ilanId
        ) !==
        String(
          guncelIlan.id
        )
      ) {
        setHata(
          "Teklif ile yük ilanı uyuşmuyor."
        );
        return;
      }

      if (
        !guncelTeklif.nakliyeciId
      ) {
        setHata(
          "Teklif veren kullanıcı bilgisi bulunamadı."
        );
        return;
      }

      // ======================================
      // DİĞER NORMAL TEKLİFLERİ
      // FIRESTORE'DAN SON KEZ OKU
      // ======================================

      const normalSnapshot =
        await getDocs(
          query(
            collection(
              db,
              "teklifler"
            ),
            where(
              "ilanSahibiId",
              "==",
              currentUser.uid
            )
          )
        );

      const digerNormalTeklifler =
        normalSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as any),
          }))
          .filter(
            (item: any) =>
              String(
                item.ilanId
              ) ===
                String(
                  guncelIlan.id
                ) &&
              item.id !==
                guncelTeklif.id &&
              item.durum ===
                "Bekliyor"
          );

      // ======================================
      // AYNI YÜK İÇİN DAHA ÖNCE BAŞKA
      // ARAÇLARA GÖNDERDİĞİM TEKLİFLER
      // ======================================

      const aracTeklifSnapshot =
        await getDocs(
          query(
            collection(
              db,
              "aracTeklifleri"
            ),
            where(
              "yukSahibiId",
              "==",
              currentUser.uid
            )
          )
        );

      const ayniYukunAracTeklifleri =
        aracTeklifSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as any),
          }))
          .filter(
            (item: any) =>
              String(
                item.yukId
              ) ===
                String(
                  guncelIlan.id
                ) &&
              item.durum ===
                "Bekliyor"
          );

      // ======================================
      // ANLAŞMA
      // ======================================

      const anlasmaId =
        String(
          guncelIlan.id
        );

      const anlasmaRef =
        doc(
          db,
          "anlasmalar",
          anlasmaId
        );

      const fiyat =
        Number(
          guncelTeklif.teklifFiyati ||
          guncelTeklif.fiyat ||
          0
        );

      const paraBirimi =
        String(
          guncelTeklif.paraBirimi ||
          "TRY"
        );

      // ======================================
      // BATCH
      // ======================================

      const batch =
        writeBatch(db);

      // 1 - KABUL EDİLEN NORMAL TEKLİF
      batch.update(
        teklifRef,
        {
          durum:
            "Kabul Edildi",

          anlasmaId,
        }
      );

      // 2 - YÜK
      batch.update(
        ilanRef,
        {
          durum:
            "Anlaşıldı",

          kabulEdilenTeklifId:
            guncelTeklif.id,

          kabulEdilenNakliyeciId:
            String(
              guncelTeklif.nakliyeciId
            ),

          kabulEdilenFiyat:
            fiyat,

          kabulEdilenParaBirimi:
            paraBirimi,

          anlasmaId,

          anlasmaTarihi:
            serverTimestamp(),
        }
      );

      // 3 - ANLAŞMA
      batch.set(
        anlasmaRef,
        {
          anlasmaId,

          ilanId:
            guncelIlan.id,

          teklifId:
            guncelTeklif.id,

          teklifTuru:
            "normal",

          ilanSahibiId:
            currentUser.uid,

          nakliyeciId:
            String(
              guncelTeklif.nakliyeciId
            ),

          nereden:
            String(
              guncelIlan.nereden ||
              guncelTeklif.nereden ||
              ""
            ),

          nereye:
            String(
              guncelIlan.nereye ||
              guncelTeklif.nereye ||
              ""
            ),

          yukTuru:
            String(
              guncelIlan.yukTuru ||
              guncelTeklif.yukTuru ||
              ""
            ),

          agirlik:
            String(
              guncelIlan.agirlik ||
              guncelTeklif.agirlik ||
              ""
            ),

          fiyat,

          paraBirimi,

          durum:
            "Aktif",

          yukSahibiTeslimOnayi:
            false,

          nakliyeciTeslimOnayi:
            false,

          createdAt:
            serverTimestamp(),
        }
      );

      // 4 - DİĞER NORMAL TEKLİFLERİ KAPAT
      for (
        const digerTeklif of
        digerNormalTeklifler
      ) {
        batch.update(
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

      // 5 - AYNI YÜK İÇİN BAŞKA ARAÇLARA
      // GÖNDERİLMİŞ TEKLİFLERİ KAPAT
      for (
        const digerAracTeklifi of
        ayniYukunAracTeklifleri
      ) {
        batch.update(
          doc(
            db,
            "aracTeklifleri",
            digerAracTeklifi.id
          ),
          {
            durum:
              "Reddedildi",
          }
        );
      }

      // ======================================
      // TÜM ANA İŞLEMLERİ TEK SEFERDE YAZ
      // ======================================

      await batch.commit();

      // ======================================
      // DİĞER NORMAL TEKLİF VERENLERE BİLDİRİM
      // ======================================

      for (
        const digerTeklif of
        digerNormalTeklifler
      ) {
        if (
          digerTeklif.nakliyeciId
        ) {
          await bildirimOlustur({
            kullaniciId:
              String(
                digerTeklif.nakliyeciId
              ),

            baslik:
              "Teklif Sonuçlandı",

            mesaj:
              `${guncelIlan.nereden || "Yük"} → ${guncelIlan.nereye || ""} ilanı için başka bir teklif kabul edildi.`,

            tip:
              "teklif_reddedildi",

            hedef:
              "/tekliflerim",
          });
        }
      }

      // ======================================
      // BAŞKA ARAÇ SAHİPLERİNE GÖNDERİLMİŞ
      // YÜK TEKLİFLERİNİ KAPATMA BİLDİRİMİ
      // ======================================

      for (
        const digerAracTeklifi of
        ayniYukunAracTeklifleri
      ) {
        if (
          digerAracTeklifi.aracSahibiId
        ) {
          await bildirimOlustur({
            kullaniciId:
              String(
                digerAracTeklifi.aracSahibiId
              ),

            baslik:
              "Yük Teklifi Sonuçlandı",

            mesaj:
              `${guncelIlan.nereden || "Yük"} → ${guncelIlan.nereye || ""} yükü başka bir taşıyıcıyla anlaşmaya vardı.`,

            tip:
              "arac_teklif_reddedildi",

            hedef:
              "/gelen-teklifler",
          });
        }
      }

      // ======================================
      // KABUL EDİLEN TAŞIYICIYA BİLDİRİM
      // ======================================

      await bildirimOlustur({
        kullaniciId:
          String(
            guncelTeklif.nakliyeciId
          ),

        baslik:
          "🎉 Teklifin Kabul Edildi!",

        mesaj:
          `${guncelIlan.nereden || "Yük"} → ${guncelIlan.nereye || ""} taşıması için teklifin kabul edildi.`,

        tip:
          "teklif_kabul",

        hedef:
          `/anlasmalarim/${anlasmaId}/sohbet`,
      });

      setBasari(
        "Teklif kabul edildi! 🎉 Anlaşma oluşturuldu ve aynı yüke ait diğer bekleyen teklifler kapatıldı."
      );
    } catch (error: any) {
      console.error(
        "Normal teklif kabul hatası:",
        error
      );

      const kod =
        error?.code || "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase işlemi engelledi. E-posta doğrulamasını, ilan durumunu ve Rules ayarlarını kontrol et."
        );
      } else {
        setHata(
          `Teklif kabul edilirken bir hata oluştu${
            kod
              ? `: ${kod}`
              : "."
          }`
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // NORMAL TEKLİFİ REDDET
  // ==========================================

  async function normalTeklifReddet(
    teklif: GelenTeklif
  ) {
    if (islemYapiliyor) {
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
      teklif.ilanSahibiId !==
      currentUser.uid
    ) {
      setHata(
        "Bu teklifi reddetme yetkin yok."
      );
      return;
    }

    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      setHata(
        "Bu teklif artık beklemede değil."
      );
      return;
    }

    const onay =
      globalThis.confirm(
        "Bu teklifi reddetmek istediğine emin misin?"
      );

    if (!onay) {
      return;
    }

    setIslemYapiliyor(
      `normal_${teklif.id}`
    );

    try {
      // Teklifi tekrar oku.
      const teklifRef =
        doc(
          db,
          "teklifler",
          teklif.id
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
        guncelTeklif.ilanSahibiId !==
        currentUser.uid
      ) {
        setHata(
          "Bu teklifi reddetme yetkin yok."
        );
        return;
      }

      if (
        guncelTeklif.durum !==
        "Bekliyor"
      ) {
        setHata(
          "Bu teklif artık beklemede değil."
        );
        return;
      }

      await updateDoc(
        teklifRef,
        {
          durum:
            "Reddedildi",
        }
      );

      if (
        guncelTeklif.nakliyeciId
      ) {
        await bildirimOlustur({
          kullaniciId:
            String(
              guncelTeklif.nakliyeciId
            ),

          baslik:
            "Teklifin Sonuçlandı",

          mesaj:
            `${teklif.ilan?.nereden || teklif.nereden || "Yük"} → ${teklif.ilan?.nereye || teklif.nereye || ""} ilanına verdiğin teklif reddedildi.`,

          tip:
            "teklif_reddedildi",

          hedef:
            "/tekliflerim",
        });
      }

      setBasari(
        "Teklif reddedildi."
      );
    } catch (error: any) {
      console.error(
        "Normal teklif red hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bu işlemi yapmaya Firebase izin vermedi."
        );
      } else {
        setHata(
          "Teklif reddedilirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // ARAÇ TEKLİFİNİ KABUL ET
  // ==========================================

  async function aracTeklifiKabulEt(
    teklif: GelenTeklif
  ) {
    if (islemYapiliyor) {
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
      teklif.aracSahibiId !==
      currentUser.uid
    ) {
      setHata(
        "Bu yük teklifini kabul etme yetkin yok."
      );
      return;
    }

    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      setHata(
        "Bu yük teklifi artık beklemede değil."
      );
      return;
    }

    if (
      !teklif.yukId ||
      !teklif.aracId ||
      !teklif.yukSahibiId
    ) {
      setHata(
        "Teklif bilgileri eksik."
      );
      return;
    }

    const onay =
      globalThis.confirm(
        "Bu yük teklifini kabul etmek istediğine emin misin? Kabul edilince anlaşma oluşturulacak ve boş araç ilanın kapatılacak."
      );

    if (!onay) {
      return;
    }

    setIslemYapiliyor(
      `arac_${teklif.id}`
    );

    try {
      // ======================================
      // ARAÇ TEKLİFİNİ SON KEZ OKU
      // ======================================

      const teklifRef =
        doc(
          db,
          "aracTeklifleri",
          teklif.id
        );

      const teklifSnap =
        await getDoc(
          teklifRef
        );

      if (!teklifSnap.exists()) {
        setHata(
          "Yük teklifi artık mevcut değil."
        );
        return;
      }

      const guncelTeklif: any = {
        id: teklifSnap.id,
        ...teklifSnap.data(),
      };

      if (
        guncelTeklif.aracSahibiId !==
        currentUser.uid
      ) {
        setHata(
          "Bu yük teklifini kabul etme yetkin yok."
        );
        return;
      }

      if (
        guncelTeklif.durum !==
        "Bekliyor"
      ) {
        setHata(
          "Bu yük teklifi artık beklemede değil."
        );
        return;
      }

      if (
        !guncelTeklif.yukId ||
        !guncelTeklif.aracId ||
        !guncelTeklif.yukSahibiId
      ) {
        setHata(
          "Teklif bilgileri eksik."
        );
        return;
      }

      // ======================================
      // YÜKÜ SON KEZ OKU
      // ======================================

      const yukRef =
        doc(
          db,
          "yukler",
          String(
            guncelTeklif.yukId
          )
        );

      const yukSnap =
        await getDoc(
          yukRef
        );

      if (!yukSnap.exists()) {
        setHata(
          "Teklif edilen yük artık mevcut değil."
        );
        return;
      }

      const guncelYuk: any = {
        id: yukSnap.id,
        ...yukSnap.data(),
      };

      if (
        String(
          guncelYuk.userId
        ) !==
        String(
          guncelTeklif.yukSahibiId
        )
      ) {
        setHata(
          "Yük sahibi bilgisi uyuşmuyor."
        );
        return;
      }

      if (
        guncelYuk.durum !==
        "Açık"
      ) {
        setHata(
          "Bu yük artık açık değil. Teklif kabul edilemez."
        );
        return;
      }

      // ======================================
      // ARACI SON KEZ OKU
      // ======================================

      const aracRef =
        doc(
          db,
          "araclar",
          String(
            guncelTeklif.aracId
          )
        );

      const aracSnap =
        await getDoc(
          aracRef
        );

      if (!aracSnap.exists()) {
        setHata(
          "Boş araç ilanı artık mevcut değil."
        );
        return;
      }

      const guncelArac: any = {
        id: aracSnap.id,
        ...aracSnap.data(),
      };

      if (
        String(
          guncelArac.userId
        ) !==
        String(
          currentUser.uid
        )
      ) {
        setHata(
          "Bu araç sana ait değil."
        );
        return;
      }

      if (
        guncelArac.durum !==
        "Açık"
      ) {
        setHata(
          "Bu araç ilanı artık açık değil."
        );
        return;
      }

      // ======================================
      // AYNI ARACA GELEN DİĞER TEKLİFLERİ
      // FIRESTORE'DAN SON KEZ OKU
      // ======================================

      const aracTeklifSnapshot =
        await getDocs(
          query(
            collection(
              db,
              "aracTeklifleri"
            ),
            where(
              "aracSahibiId",
              "==",
              currentUser.uid
            )
          )
        );

      const digerAracTeklifleri =
        aracTeklifSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...(item.data() as any),
          }))
          .filter(
            (item: any) =>
              String(
                item.aracId
              ) ===
                String(
                  guncelTeklif.aracId
                ) &&
              item.id !==
                guncelTeklif.id &&
              item.durum ===
                "Bekliyor"
          );

      // ======================================
      // ANLAŞMA
      // ======================================

      const anlasmaId =
        String(
          guncelYuk.id
        );

      const anlasmaRef =
        doc(
          db,
          "anlasmalar",
          anlasmaId
        );

      const anlasmaFiyati =
        Number(
          guncelYuk.fiyat ||
          guncelTeklif.yukFiyati ||
          0
        );

      const paraBirimi =
        String(
          guncelYuk.paraBirimi ||
          guncelTeklif.paraBirimi ||
          "TRY"
        );

      // ======================================
      // BATCH
      // ======================================

      const batch =
        writeBatch(db);

      // 1 - ARAÇ TEKLİFİNİ KABUL ET
      batch.update(
        teklifRef,
        {
          durum:
            "Kabul Edildi",

          anlasmaId,
        }
      );

      // 2 - YÜKÜ ANLAŞMAYA BAĞLA
      batch.update(
        yukRef,
        {
          durum:
            "Anlaşıldı",

          kabulEdilenTeklifId:
            guncelTeklif.id,

          kabulEdilenNakliyeciId:
            currentUser.uid,

          kabulEdilenFiyat:
            anlasmaFiyati,

          kabulEdilenParaBirimi:
            paraBirimi,

          anlasmaId,

          anlasmaTarihi:
            serverTimestamp(),
        }
      );

      // 3 - ANLAŞMA OLUŞTUR
      batch.set(
        anlasmaRef,
        {
          anlasmaId,

          ilanId:
            guncelYuk.id,

          teklifId:
            guncelTeklif.id,

          teklifTuru:
            "arac",

          aracId:
            guncelArac.id,

          ilanSahibiId:
            String(
              guncelTeklif.yukSahibiId
            ),

          nakliyeciId:
            currentUser.uid,

          nereden:
            String(
              guncelYuk.nereden ||
              guncelTeklif.nereden ||
              ""
            ),

          nereye:
            String(
              guncelYuk.nereye ||
              guncelTeklif.nereye ||
              ""
            ),

          yukTuru:
            String(
              guncelYuk.yukTuru ||
              guncelTeklif.yukTuru ||
              ""
            ),

          agirlik:
            String(
              guncelYuk.agirlik ||
              guncelTeklif.agirlik ||
              ""
            ),

          fiyat:
            anlasmaFiyati,

          paraBirimi,

          durum:
            "Aktif",

          yukSahibiTeslimOnayi:
            false,

          nakliyeciTeslimOnayi:
            false,

          createdAt:
            serverTimestamp(),
        }
      );

      // 4 - KABUL EDİLEN ARAÇ ARTIK BOŞ DEĞİL
      batch.update(
        aracRef,
        {
          durum:
            "Kapalı",

          kapanmaTarihi:
            serverTimestamp(),
        }
      );

      // 5 - AYNI ARACA GELEN DİĞER
      // BEKLEYEN YÜK TEKLİFLERİNİ REDDET
      for (
        const digerTeklif of
        digerAracTeklifleri
      ) {
        batch.update(
          doc(
            db,
            "aracTeklifleri",
            digerTeklif.id
          ),
          {
            durum:
              "Reddedildi",
          }
        );
      }

      await batch.commit();

      // ======================================
      // KABUL EDİLEN YÜK SAHİBİNE BİLDİRİM
      // ======================================

      await bildirimOlustur({
        kullaniciId:
          String(
            guncelTeklif.yukSahibiId
          ),

        baslik:
          "🎉 Yük Teklifin Kabul Edildi!",

        mesaj:
          `${guncelYuk.nereden || "Yük"} → ${guncelYuk.nereye || ""} yükün için araç sahibi teklifini kabul etti.`,

        tip:
          "arac_teklif_kabul",

        hedef:
          `/anlasmalarim/${anlasmaId}/sohbet`,
      });

      // ======================================
      // AYNI ARACA TEKLİF GÖNDEREN
      // DİĞER YÜK SAHİPLERİ
      // ======================================

      for (
        const digerTeklif of
        digerAracTeklifleri
      ) {
        if (
          digerTeklif.yukSahibiId
        ) {
          await bildirimOlustur({
            kullaniciId:
              String(
                digerTeklif.yukSahibiId
              ),

            baslik:
              "Araç Teklifi Sonuçlandı",

            mesaj:
              "Teklif gönderdiğin boş araç başka bir yük için anlaşmaya vardı.",

            tip:
              "arac_teklif_reddedildi",

            hedef:
              "/tekliflerim",
          });
        }
      }

      setBasari(
        "Yük teklifi kabul edildi! 🎉 Anlaşma oluşturuldu ve araç ilanı kapatıldı."
      );
    } catch (error: any) {
      console.error(
        "Araç teklifi kabul hatası:",
        error
      );

      const kod =
        error?.code || "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase işlemi engelledi. Rules, e-posta doğrulaması veya ilan durumlarından biri işlemi engelliyor."
        );
      } else {
        setHata(
          `Yük teklifi kabul edilirken bir hata oluştu${
            kod
              ? `: ${kod}`
              : "."
          }`
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // ARAÇ TEKLİFİNİ REDDET
  // ==========================================

  async function aracTeklifiReddet(
    teklif: GelenTeklif
  ) {
    if (islemYapiliyor) {
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
      teklif.aracSahibiId !==
      currentUser.uid
    ) {
      setHata(
        "Bu yük teklifini reddetme yetkin yok."
      );
      return;
    }

    if (
      teklif.durum !==
      "Bekliyor"
    ) {
      setHata(
        "Bu yük teklifi artık beklemede değil."
      );
      return;
    }

    const onay =
      globalThis.confirm(
        "Bu yük teklifini reddetmek istediğine emin misin?"
      );

    if (!onay) {
      return;
    }

    setIslemYapiliyor(
      `arac_${teklif.id}`
    );

    try {
      const teklifRef =
        doc(
          db,
          "aracTeklifleri",
          teklif.id
        );

      const teklifSnap =
        await getDoc(
          teklifRef
        );

      if (!teklifSnap.exists()) {
        setHata(
          "Yük teklifi artık mevcut değil."
        );
        return;
      }

      const guncelTeklif: any = {
        id: teklifSnap.id,
        ...teklifSnap.data(),
      };

      if (
        guncelTeklif.aracSahibiId !==
        currentUser.uid
      ) {
        setHata(
          "Bu yük teklifini reddetme yetkin yok."
        );
        return;
      }

      if (
        guncelTeklif.durum !==
        "Bekliyor"
      ) {
        setHata(
          "Bu yük teklifi artık beklemede değil."
        );
        return;
      }

      await updateDoc(
        teklifRef,
        {
          durum:
            "Reddedildi",
        }
      );

      if (
        guncelTeklif.yukSahibiId
      ) {
        await bildirimOlustur({
          kullaniciId:
            String(
              guncelTeklif.yukSahibiId
            ),

          baslik:
            "Yük Teklifin Sonuçlandı",

          mesaj:
            `${teklif.yuk?.nereden || teklif.nereden || "Yük"} → ${teklif.yuk?.nereye || teklif.nereye || ""} yük teklifin araç sahibi tarafından reddedildi.`,

          tip:
            "arac_teklif_reddedildi",

          hedef:
            "/tekliflerim",
        });
      }

      setBasari(
        "Yük teklifi reddedildi."
      );
    } catch (error: any) {
      console.error(
        "Araç teklifi red hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bu yük teklifini reddetmeye Firebase izin vermedi."
        );
      } else {
        setHata(
          "Yük teklifi reddedilirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // SOHBETE GİT
  // ==========================================

  function sohbeteGit(
    teklif: GelenTeklif
  ) {
    const anlasmaId =
      teklif.anlasmaId ||
      teklif.ilanId ||
      teklif.yukId;

    if (!anlasmaId) {
      setHata(
        "Anlaşma bilgisi bulunamadı."
      );
      return;
    }

    router.push(
      `/anlasmalarim/${anlasmaId}/sohbet`
    );
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-5xl mb-4">
            💰
          </div>

          <p className="text-xl font-bold">
            Gelen teklifler yükleniyor...
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700">
              💰 Gelen Teklifler
            </h1>

            <p className="text-gray-500 mt-2">
              Yük ilanlarına ve boş araçlarına gelen teklifleri buradan yönetebilirsin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                router.push(
                  "/benim-ilanlarim"
                );
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
            >
              📦 İlanlarım
            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/bos-arac"
                );
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
            >
              🚛 Boş Araçlar
            </button>
          </div>
        </div>

        {/* ÖZET */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-blue-700 font-extrabold text-lg">
              💰 Yük İlanı Teklifleri
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {normalTeklifler.length}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <p className="text-orange-700 font-extrabold text-lg">
              📦 Araçlarıma Yük Teklifleri
            </p>

            <p className="text-3xl font-extrabold mt-2">
              {aracTeklifleri.length}
            </p>
          </div>
        </div>

        {/* HATA */}

        {hata !== "" && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl font-bold">
            ⚠️ {hata}
          </div>
        )}

        {/* BAŞARI */}

        {basari !== "" && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl font-bold">
            {basari}
          </div>
        )}

        {/* TEKLİF YOK */}

        {teklifler.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-6xl">
              📭
            </div>

            <h2 className="text-2xl font-extrabold mt-5">
              Henüz teklif gelmedi
            </h2>

            <p className="text-gray-500 mt-3">
              Yük ilanlarına fiyat teklifi veya boş araçlarına yük teklifi geldiğinde burada görünecek.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push("/");
              }}
              className="mt-6 bg-gray-900 hover:bg-gray-800 text-white px-7 py-3 rounded-xl font-bold"
            >
              🏠 Ana Sayfa
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {teklifler.map(
              (teklif) => {
                const bekliyor =
                  teklif.durum ===
                  "Bekliyor";

                const kabulEdildi =
                  teklif.durum ===
                  "Kabul Edildi";

                const reddedildi =
                  teklif.durum ===
                  "Reddedildi";

                const islemKey =
                  `${teklif.teklifTuru}_${teklif.id}`;

                const buTeklifIsleniyor =
                  islemYapiliyor ===
                  islemKey;

                // ==================================
                // NORMAL TEKLİF
                // ==================================

                if (
                  teklif.teklifTuru ===
                  "normal"
                ) {
                  const ilan =
                    teklif.ilan || {};

                  const teklifVeren =
                    teklif.nakliyeci || {};

                  const telefon =
                    teklifVeren.phone ||
                    teklifVeren.telefon ||
                    "";

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
                      className="bg-white rounded-3xl shadow-xl p-5 sm:p-7"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                        <div>
                          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-extrabold mb-3">
                            💰 Yük İlanına Gelen Teklif
                          </span>

                          <h2 className="text-xl sm:text-2xl font-extrabold text-blue-700">
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
                          className={`px-4 py-2 rounded-full font-bold self-start ${
                            kabulEdildi
                              ? "bg-green-100 text-green-700"
                              : reddedildi
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {kabulEdildi
                            ? "✅ Kabul Edildi"
                            : reddedildi
                            ? "❌ Reddedildi"
                            : "⏳ Bekliyor"}
                        </span>
                      </div>

                      {/* TEKLİF VEREN */}

                      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <p className="font-extrabold text-lg">
                          👤 Teklif Veren
                        </p>

                        <p className="mt-2">
                          <strong>
                            Ad Soyad:
                          </strong>{" "}
                          {teklifVeren.name ||
                            teklifVeren.adSoyad ||
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

                        {teklif.nakliyeciId && (
                          <button
                            type="button"
                            onClick={() => {
                              router.push(
                                `/kullanici/${teklif.nakliyeciId}`
                              );
                            }}
                            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold"
                          >
                            👤 Teklif Verenin Profilini Gör
                          </button>
                        )}
                      </div>

                      {/* FİYAT */}

                      <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-5">
                        <p className="text-gray-600 font-semibold">
                          💰 Taşıma Teklifi
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
                            📝 Teklif Verenin Mesajı
                          </p>

                          <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                            {teklif.mesaj}
                          </p>
                        </div>
                      )}

                      {/* BEKLEYEN */}

                      {bekliyor && (
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              normalTeklifKabulEt(
                                teklif
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-4 rounded-xl font-bold text-lg"
                          >
                            {buTeklifIsleniyor
                              ? "⏳ İşlem yapılıyor..."
                              : "✅ Teklifi Kabul Et"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              normalTeklifReddet(
                                teklif
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-4 rounded-xl font-bold text-lg"
                          >
                            {buTeklifIsleniyor
                              ? "⏳ İşlem yapılıyor..."
                              : "❌ Teklifi Reddet"}
                          </button>
                        </div>
                      )}

                      {/* KABUL EDİLDİ */}

                      {kabulEdildi && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
                          <p className="text-green-700 font-extrabold text-lg">
                            🎉 Bu teklif kabul edildi!
                          </p>

                          <p className="text-green-700 mt-2">
                            Taşıma anlaşması oluşturuldu.
                          </p>

                          <div className="mt-5 flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                sohbeteGit(
                                  teklif
                                );
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-xl font-bold"
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
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-xl font-bold"
                            >
                              🤝 Anlaşmalarım
                            </button>
                          </div>
                        </div>
                      )}

                      {reddedildi && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
                          <p className="text-red-700 font-extrabold">
                            ❌ Bu teklif reddedildi.
                          </p>
                        </div>
                      )}

                      {teklif.ilanId && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/ilan/${teklif.ilanId}`
                            );
                          }}
                          className="mt-6 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          🔎 Yük İlanını Gör
                        </button>
                      )}
                    </div>
                  );
                }

                // ==================================
                // BOŞ ARACA GELEN YÜK TEKLİFİ
                // ==================================

                const yuk =
                  teklif.yuk || {};

                const yukSahibi =
                  teklif.yukSahibi || {};

                const arac =
                  teklif.arac || {};

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
                  yukSahibi.phone ||
                  yukSahibi.telefon ||
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
                          📦 Boş Aracına Gelen Yük Teklifi
                        </span>

                        <h2 className="text-xl sm:text-2xl font-extrabold text-orange-700">
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
                        className={`px-4 py-2 rounded-full font-bold self-start ${
                          kabulEdildi
                            ? "bg-green-100 text-green-700"
                            : reddedildi
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {kabulEdildi
                          ? "✅ Kabul Edildi"
                          : reddedildi
                          ? "❌ Reddedildi"
                          : "⏳ Bekliyor"}
                      </span>
                    </div>

                    {/* YÜK */}

                    <div className="mt-5 bg-orange-50 border border-orange-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg text-orange-700">
                        📦 Teklif Edilen Yük
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

                    {/* ARAÇ */}

                    <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg text-green-700">
                        🚛 Senin Aracın
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

                    {/* YÜK SAHİBİ */}

                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-2xl p-5">
                      <p className="font-extrabold text-lg">
                        👤 Yük Sahibi
                      </p>

                      <p className="mt-2">
                        <strong>
                          Ad Soyad:
                        </strong>{" "}
                        {yukSahibi.name ||
                          yukSahibi.adSoyad ||
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

                      {teklif.yukSahibiId && (
                        <button
                          type="button"
                          onClick={() => {
                            router.push(
                              `/kullanici/${teklif.yukSahibiId}`
                            );
                          }}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-bold"
                        >
                          👤 Yük Sahibinin Profilini Gör
                        </button>
                      )}
                    </div>

                    {/* MESAJ */}

                    {teklif.mesaj && (
                      <div className="mt-5 bg-gray-50 rounded-2xl p-5">
                        <p className="font-extrabold">
                          📝 Yük Sahibinin Mesajı
                        </p>

                        <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                          {teklif.mesaj}
                        </p>
                      </div>
                    )}

                    {/* BEKLEYEN */}

                    {bekliyor && (
                      <div className="mt-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                          <p className="text-yellow-800 font-bold">
                            ℹ️ Kabul ettiğinde bu yük için anlaşma oluşturulur ve boş araç ilanın kapatılır.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              aracTeklifiKabulEt(
                                teklif
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-4 rounded-xl font-extrabold text-lg"
                          >
                            {buTeklifIsleniyor
                              ? "⏳ Anlaşma oluşturuluyor..."
                              : "✅ Yük Teklifini Kabul Et"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              aracTeklifiReddet(
                                teklif
                              );
                            }}
                            disabled={
                              islemYapiliyor !==
                              ""
                            }
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-5 py-4 rounded-xl font-extrabold text-lg"
                          >
                            {buTeklifIsleniyor
                              ? "⏳ İşlem yapılıyor..."
                              : "❌ Yük Teklifini Reddet"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* KABUL EDİLDİ */}

                    {kabulEdildi && (
                      <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
                        <p className="text-green-700 font-extrabold text-lg">
                          🎉 Yük teklifi kabul edildi!
                        </p>

                        <p className="text-green-700 mt-2">
                          Anlaşma oluşturuldu. Artık yük sahibiyle sohbet edebilirsin.
                        </p>

                        <div className="mt-5 flex flex-col sm:flex-row gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              sohbeteGit(
                                teklif
                              );
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 rounded-xl font-bold"
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
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-4 rounded-xl font-bold"
                          >
                            🤝 Anlaşmalarım
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RED */}

                    {reddedildi && (
                      <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">
                        <p className="text-red-700 font-extrabold">
                          ❌ Bu yük teklifi reddedildi.
                        </p>
                      </div>
                    )}

                    {/* YÜK DETAY */}

                    {teklif.yukId && (
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/ilan/${teklif.yukId}`
                          );
                        }}
                        className="mt-6 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
                      >
                        🔎 Yük İlanını Gör
                      </button>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* ALT MENÜ */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10">
          <button
            type="button"
            onClick={() => {
              router.push(
                "/bos-arac"
              );
            }}
            className="bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold"
          >
            🚛 Boş Araçlar
          </button>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/anlasmalarim"
              );
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold"
          >
            🤝 Anlaşmalarım
          </button>

          <button
            type="button"
            onClick={() => {
              router.push("/");
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold"
          >
            🏠 Ana Sayfa
          </button>
        </div>
      </div>
    </main>
  );
}