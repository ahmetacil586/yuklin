"use client";

import { useEffect, useState } from "react";
import {
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

type Bildirim = {
  id: string;

  kullaniciId?: string;

  baslik?: string;
  mesaj?: string;
  aciklama?: string;

  tip?: string;
  tur?: string;

  hedef?: string;
  link?: string;
  url?: string;

  anlasmaId?: string;
  ilanId?: string;
  teklifId?: string;
  aracId?: string;

  okundu?: boolean;

  createdAt?: any;
  olusturulmaTarihi?: any;
  tarih?: any;

  [key: string]: any;
};

export default function BildirimlerPage() {
  const router = useRouter();

  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [loading, setLoading] = useState(true);

  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");

  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [silinenId, setSilinenId] = useState("");

  // ==========================================
  // BİLDİRİMLERİ GETİR
  // ==========================================

  useEffect(() => {
    let unsubscribeBildirimler: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        setLoading(true);
        setHata("");

        const bildirimQuery = query(
          collection(db, "bildirimler"),
          where(
            "kullaniciId",
            "==",
            user.uid
          )
        );

        unsubscribeBildirimler = onSnapshot(
          bildirimQuery,
          (snapshot) => {
            const liste: Bildirim[] =
              snapshot.docs.map(
                (item) => ({
                  id: item.id,
                  ...item.data(),
                })
              );

            // ==================================
            // EN YENİ BİLDİRİM ÜSTTE
            // ==================================

            liste.sort(
              (a, b) => {
                const aTarih =
                  tarihSaniyesiBul(a);

                const bTarih =
                  tarihSaniyesiBul(b);

                return (
                  bTarih -
                  aTarih
                );
              }
            );

            setBildirimler(liste);
            setHata("");
            setLoading(false);
          },
          (error) => {
            console.error(
              "Bildirim dinleme hatası:",
              error
            );

            if (
              error?.code ===
              "permission-denied"
            ) {
              setHata(
                "Bildirimleri görüntülemeye Firebase izin vermedi."
              );
            } else {
              setHata(
                "Bildirimler alınırken bir hata oluştu."
              );
            }

            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribeAuth();

      if (
        unsubscribeBildirimler
      ) {
        unsubscribeBildirimler();
      }
    };
  }, [router]);

  // ==========================================
  // TARİH SANİYESİ BUL
  // ==========================================

  function tarihSaniyesiBul(
    bildirim: Bildirim
  ) {
    const tarih =
      bildirim.olusturulmaTarihi ||
      bildirim.createdAt ||
      bildirim.tarih;

    if (!tarih) {
      return 0;
    }

    if (
      typeof tarih.seconds ===
      "number"
    ) {
      return tarih.seconds;
    }

    if (
      typeof tarih.toDate ===
      "function"
    ) {
      try {
        return Math.floor(
          tarih
            .toDate()
            .getTime() /
            1000
        );
      } catch {
        return 0;
      }
    }

    try {
      const date =
        new Date(tarih);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return 0;
      }

      return Math.floor(
        date.getTime() /
          1000
      );
    } catch {
      return 0;
    }
  }

  // ==========================================
  // OKUNMAMIŞ SAYISI
  // ==========================================

  const okunmamisSayisi =
    bildirimler.filter(
      (bildirim) =>
        bildirim.okundu !== true
    ).length;

  const okunmusSayisi =
    bildirimler.filter(
      (bildirim) =>
        bildirim.okundu === true
    ).length;

  // ==========================================
  // BİLDİRİM TÜRÜ
  //
  // Yeni sistem: tip
  // Eski sistem: tur
  // ==========================================

  function bildirimTuruBul(
    bildirim: Bildirim
  ) {
    return String(
      bildirim.tip ||
        bildirim.tur ||
        ""
    )
      .trim()
      .toLowerCase();
  }

  // ==========================================
  // TARİH GÖSTER
  // ==========================================

  function tarihGoster(
    bildirim: Bildirim
  ) {
    const tarih =
      bildirim.olusturulmaTarihi ||
      bildirim.createdAt ||
      bildirim.tarih;

    if (!tarih) {
      return "";
    }

    try {
      let date: Date;

      if (
        typeof tarih.toDate ===
        "function"
      ) {
        date =
          tarih.toDate();
      } else if (
        typeof tarih.seconds ===
        "number"
      ) {
        date = new Date(
          tarih.seconds *
            1000
        );
      } else {
        date =
          new Date(tarih);
      }

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return date.toLocaleString(
        "tr-TR",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  }

  // ==========================================
  // BİLDİRİM İKONU
  // ==========================================

  function bildirimIkonu(
    bildirim: Bildirim
  ) {
    const tur =
      bildirimTuruBul(
        bildirim
      );

    if (
      tur.includes("mesaj") ||
      tur.includes("sohbet")
    ) {
      return "💬";
    }

    if (
      tur.includes("teklif")
    ) {
      if (
        tur.includes("kabul")
      ) {
        return "✅";
      }

      if (
        tur.includes("red") ||
        tur.includes("redd")
      ) {
        return "❌";
      }

      return "💰";
    }

    if (
      tur.includes("anlas") ||
      tur.includes("anlaş")
    ) {
      return "🤝";
    }

    if (
      tur.includes("teslim")
    ) {
      return "🚚";
    }

    if (
      tur.includes(
        "tamam"
      )
    ) {
      return "✅";
    }

    if (
      tur.includes("deger") ||
      tur.includes("değer") ||
      tur.includes("puan")
    ) {
      return "⭐";
    }

    if (
      tur.includes("arac") ||
      tur.includes("araç")
    ) {
      return "🚛";
    }

    if (
      tur.includes("yuk") ||
      tur.includes("yük") ||
      tur.includes("ilan")
    ) {
      return "📦";
    }

    return "🔔";
  }

  // ==========================================
  // BİLDİRİM BAŞLIĞI
  // ==========================================

  function bildirimBasligi(
    bildirim: Bildirim
  ) {
    if (
      typeof bildirim.baslik ===
        "string" &&
      bildirim.baslik.trim() !==
        ""
    ) {
      return bildirim.baslik;
    }

    const tur =
      bildirimTuruBul(
        bildirim
      );

    if (
      tur.includes("mesaj") ||
      tur.includes("sohbet")
    ) {
      return "Yeni Mesaj";
    }

    if (
      tur.includes("teklif")
    ) {
      if (
        tur.includes("kabul")
      ) {
        return "Teklifin Kabul Edildi";
      }

      if (
        tur.includes("red") ||
        tur.includes("redd")
      ) {
        return "Teklif Sonucu";
      }

      return "Yeni Teklif";
    }

    if (
      tur.includes("anlas") ||
      tur.includes("anlaş")
    ) {
      return "Anlaşma Bildirimi";
    }

    if (
      tur.includes("teslim")
    ) {
      return "Teslimat Bildirimi";
    }

    if (
      tur.includes(
        "tamam"
      )
    ) {
      return "Taşıma Tamamlandı";
    }

    if (
      tur.includes("deger") ||
      tur.includes("değer") ||
      tur.includes("puan")
    ) {
      return "Değerlendirme";
    }

    if (
      tur.includes("arac") ||
      tur.includes("araç")
    ) {
      return "Araç Bildirimi";
    }

    if (
      tur.includes("yuk") ||
      tur.includes("yük") ||
      tur.includes("ilan")
    ) {
      return "İlan Bildirimi";
    }

    return "Bildirim";
  }

  // ==========================================
  // BİLDİRİM METNİ
  // ==========================================

  function bildirimMetni(
    bildirim: Bildirim
  ) {
    if (
      typeof bildirim.mesaj ===
        "string" &&
      bildirim.mesaj.trim() !==
        ""
    ) {
      return bildirim.mesaj;
    }

    if (
      typeof bildirim.aciklama ===
        "string" &&
      bildirim.aciklama.trim() !==
        ""
    ) {
      return bildirim.aciklama;
    }

    return "Yeni bir bildirimin var.";
  }

  // ==========================================
  // GÜVENLİ İÇ LİNK KONTROLÜ
  // ==========================================

  function guvenliIcLink(
    deger: unknown
  ) {
    if (
      typeof deger !==
      "string"
    ) {
      return "";
    }

    const temiz =
      deger.trim();

    if (
      !temiz.startsWith("/")
    ) {
      return "";
    }

    // //evil-site.com gibi bir adresi
    // kabul etme.
    if (
      temiz.startsWith("//")
    ) {
      return "";
    }

    return temiz;
  }

  // ==========================================
  // BİLDİRİM LİNKİ
  //
  // Yeni sistem: hedef
  // Eski sistem: link / url
  // ==========================================

  function bildirimLinki(
    bildirim: Bildirim
  ) {
    // ======================================
    // 1 - YENİ SİSTEM: HEDEF
    // ======================================

    const hedef =
      guvenliIcLink(
        bildirim.hedef
      );

    if (hedef) {
      return hedef;
    }

    // ======================================
    // 2 - ESKİ SİSTEM: LINK
    // ======================================

    const link =
      guvenliIcLink(
        bildirim.link
      );

    if (link) {
      return link;
    }

    // ======================================
    // 3 - ESKİ SİSTEM: URL
    // ======================================

    const url =
      guvenliIcLink(
        bildirim.url
      );

    if (url) {
      return url;
    }

    // ======================================
    // 4 - OTOMATİK HEDEF BELİRLE
    // ======================================

    const tur =
      bildirimTuruBul(
        bildirim
      );

    // ======================================
    // MESAJ / SOHBET
    // ======================================

    if (
      tur.includes("mesaj") ||
      tur.includes("sohbet")
    ) {
      if (
        bildirim.anlasmaId
      ) {
        return `/anlasmalarim/${bildirim.anlasmaId}/sohbet`;
      }

      return "/anlasmalarim";
    }

    // ======================================
    // ANLAŞMA
    // ======================================

    if (
      tur.includes("anlas") ||
      tur.includes("anlaş")
    ) {
      return "/anlasmalarim";
    }

    // ======================================
    // TESLİMAT
    // ======================================

    if (
      tur.includes("teslim") ||
      tur.includes(
        "tamam"
      )
    ) {
      return "/anlasmalarim";
    }

    // ======================================
    // DEĞERLENDİRME
    // ======================================

    if (
      tur.includes("deger") ||
      tur.includes("değer") ||
      tur.includes("puan")
    ) {
      return "/profil";
    }

    // ======================================
    // TEKLİF
    // ======================================

    if (
      tur.includes("teklif")
    ) {
      // Teklif kabul/red cevabı geldiyse
      // bu kullanıcı büyük ihtimalle
      // kendi gönderdiği teklifin sonucunu
      // görmek istiyor.

      if (
        tur.includes("kabul") ||
        tur.includes("red") ||
        tur.includes("redd") ||
        tur.includes("sonuc") ||
        tur.includes("sonuç")
      ) {
        return "/tekliflerim";
      }

      // Yeni teklif bildirimi geldiyse
      // kullanıcı kendi ilanına/araç ilanına
      // gelen teklifi görmeli.

      return "/gelen-teklifler";
    }

    // ======================================
    // İLAN ID VARSA İLANA GİT
    // ======================================

    if (
      bildirim.ilanId
    ) {
      return `/ilan/${bildirim.ilanId}`;
    }

    return "";
  }

  // ==========================================
  // BİLDİRİME TIKLA
  // ==========================================

  async function bildirimeTikla(
    bildirim: Bildirim
  ) {
    setHata("");
    setBasari("");

    try {
      // ======================================
      // OKUNMADIYSA OKUNDU YAP
      // ======================================

      if (
        bildirim.okundu !== true
      ) {
        await updateDoc(
          doc(
            db,
            "bildirimler",
            bildirim.id
          ),
          {
            okundu: true,
          }
        );
      }

      // ======================================
      // HEDEFE GİT
      // ======================================

      const link =
        bildirimLinki(
          bildirim
        );

      if (link) {
        router.push(link);
      }
    } catch (error: any) {
      console.error(
        "Bildirim açma hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bildirim açılırken Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Bildirim açılırken bir hata oluştu."
        );
      }
    }
  }

  // ==========================================
  // TEK BİLDİRİMİ SİL
  // ==========================================

  async function bildirimSil(
    bildirimId: string
  ) {
    const onay =
      globalThis.confirm?.(
        "Bu bildirimi silmek istediğine emin misin?"
      ) ?? false;

    if (!onay) {
      return;
    }

    setHata("");
    setBasari("");

    try {
      setSilinenId(
        bildirimId
      );

      await deleteDoc(
        doc(
          db,
          "bildirimler",
          bildirimId
        )
      );

      setBasari(
        "Bildirim silindi. ✅"
      );
    } catch (error: any) {
      console.error(
        "Bildirim silme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bildirim silinemedi. Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Bildirim silinirken bir hata oluştu."
        );
      }
    } finally {
      setSilinenId("");
    }
  }

  // ==========================================
  // TÜMÜNÜ OKUNDU YAP
  // ==========================================

  async function tumunuOkunduYap() {
    if (islemYapiliyor) {
      return;
    }

    const okunmamislar =
      bildirimler.filter(
        (bildirim) =>
          bildirim.okundu !==
          true
      );

    if (
      okunmamislar.length ===
      0
    ) {
      setBasari(
        "Okunmamış bildirimin yok."
      );

      return;
    }

    setHata("");
    setBasari("");
    setIslemYapiliyor(true);

    try {
      await Promise.all(
        okunmamislar.map(
          (bildirim) =>
            updateDoc(
              doc(
                db,
                "bildirimler",
                bildirim.id
              ),
              {
                okundu: true,
              }
            )
        )
      );

      setBasari(
        "Tüm bildirimler okundu olarak işaretlendi. ✅"
      );
    } catch (error: any) {
      console.error(
        "Bildirim güncelleme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bildirimler güncellenemedi. Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Bildirimler güncellenirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(false);
    }
  }

  // ==========================================
  // OKUNMUŞLARI TEMİZLE
  // ==========================================

  async function okunmuslariTemizle() {
    if (islemYapiliyor) {
      return;
    }

    const okunmuslar =
      bildirimler.filter(
        (bildirim) =>
          bildirim.okundu ===
          true
      );

    if (
      okunmuslar.length ===
      0
    ) {
      setBasari(
        "Silinecek okunmuş bildirim yok."
      );

      return;
    }

    const onay =
      globalThis.confirm?.(
        `${okunmuslar.length} okunmuş bildirimi silmek istediğine emin misin?`
      ) ?? false;

    if (!onay) {
      return;
    }

    setHata("");
    setBasari("");
    setIslemYapiliyor(true);

    try {
      await Promise.all(
        okunmuslar.map(
          (bildirim) =>
            deleteDoc(
              doc(
                db,
                "bildirimler",
                bildirim.id
              )
            )
        )
      );

      setBasari(
        "Okunmuş bildirimler temizlendi. 🧹"
      );
    } catch (error: any) {
      console.error(
        "Okunmuş bildirim silme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Okunmuş bildirimler silinemedi. Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Okunmuş bildirimler silinirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(false);
    }
  }

  // ==========================================
  // TÜM BİLDİRİMLERİ TEMİZLE
  // ==========================================

  async function tumunuTemizle() {
    if (
      islemYapiliyor
    ) {
      return;
    }

    if (
      bildirimler.length ===
      0
    ) {
      return;
    }

    const onay =
      globalThis.confirm?.(
        `Tüm bildirimlerini (${bildirimler.length}) kalıcı olarak silmek istediğine emin misin?`
      ) ?? false;

    if (!onay) {
      return;
    }

    setHata("");
    setBasari("");
    setIslemYapiliyor(true);

    try {
      await Promise.all(
        bildirimler.map(
          (bildirim) =>
            deleteDoc(
              doc(
                db,
                "bildirimler",
                bildirim.id
              )
            )
        )
      );

      setBasari(
        "Tüm bildirimler temizlendi. 🗑️"
      );
    } catch (error: any) {
      console.error(
        "Tüm bildirimleri silme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Bildirimler silinemedi. Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Bildirimler silinirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(false);
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
            🔔
          </div>

          <p className="text-xl font-bold">
            Bildirimler yükleniyor...
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
      <div className="max-w-4xl mx-auto">

        {/* ==================================
            BAŞLIK
        ================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700">
              🔔 Bildirimlerim
            </h1>

            <p className="text-gray-500 mt-2">
              Teklif, anlaşma, mesaj ve diğer gelişmeleri buradan takip edebilirsin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              router.push("/");
            }}
            className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← Ana Sayfa
          </button>
        </div>

        {/* ==================================
            ÖZET
        ================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">

          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-blue-700">
              {bildirimler.length}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Toplam
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-blue-700">
              {okunmamisSayisi}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Yeni
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center shadow-sm col-span-2 sm:col-span-1">
            <p className="text-3xl font-extrabold text-green-700">
              {okunmusSayisi}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Okundu
            </p>
          </div>

        </div>

        {/* ==================================
            HATA
        ================================== */}

        {hata !== "" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-5 font-bold">
            ⚠️ {hata}
          </div>
        )}

        {/* ==================================
            BAŞARI
        ================================== */}

        {basari !== "" && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-5 font-bold">
            {basari}
          </div>
        )}

        {/* ==================================
            ÜST İŞLEMLER
        ================================== */}

        {bildirimler.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
            <div className="grid sm:grid-cols-3 gap-3">

              <button
                type="button"
                onClick={
                  tumunuOkunduYap
                }
                disabled={
                  islemYapiliyor ||
                  okunmamisSayisi ===
                    0
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold"
              >
                ✓ Tümünü Okundu Yap
              </button>

              <button
                type="button"
                onClick={
                  okunmuslariTemizle
                }
                disabled={
                  islemYapiliyor ||
                  okunmusSayisi ===
                    0
                }
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold"
              >
                🧹 Okunmuşları Temizle
              </button>

              <button
                type="button"
                onClick={
                  tumunuTemizle
                }
                disabled={
                  islemYapiliyor
                }
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-bold"
              >
                🗑️ Tümünü Temizle
              </button>

            </div>
          </div>
        )}

        {/* ==================================
            BİLDİRİM YOK
        ================================== */}

        {bildirimler.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
            <div className="text-6xl mb-5">
              🔔
            </div>

            <h2 className="text-2xl font-extrabold">
              Henüz bildirimin yok
            </h2>

            <p className="text-gray-500 mt-3">
              Yeni teklif, mesaj ve anlaşma bildirimlerin burada görünecek.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push("/");
              }}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              🏠 Ana Sayfa
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {bildirimler.map(
              (bildirim) => {
                const okundu =
                  bildirim.okundu ===
                  true;

                const tarih =
                  tarihGoster(
                    bildirim
                  );

                const link =
                  bildirimLinki(
                    bildirim
                  );

                return (
                  <div
                    key={
                      bildirim.id
                    }
                    className={`rounded-2xl border shadow-sm overflow-hidden transition ${
                      okundu
                        ? "bg-white border-gray-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="p-4 sm:p-5">

                      <div className="flex items-start gap-3 sm:gap-4">

                        {/* =====================
                            İKON
                        ===================== */}

                        <button
                          type="button"
                          onClick={() => {
                            bildirimeTikla(
                              bildirim
                            );
                          }}
                          className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl"
                          title="Bildirimi aç"
                        >
                          {bildirimIkonu(
                            bildirim
                          )}
                        </button>

                        {/* =====================
                            İÇERİK
                        ===================== */}

                        <button
                          type="button"
                          onClick={() => {
                            bildirimeTikla(
                              bildirim
                            );
                          }}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">

                            <h2 className="font-extrabold text-base sm:text-lg text-gray-900">
                              {bildirimBasligi(
                                bildirim
                              )}
                            </h2>

                            {!okundu && (
                              <span className="bg-blue-600 text-white text-xs font-extrabold px-2 py-1 rounded-full">
                                YENİ
                              </span>
                            )}

                          </div>

                          <p className="text-gray-600 mt-2 break-words">
                            {bildirimMetni(
                              bildirim
                            )}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-3">

                            {tarih && (
                              <span className="text-xs sm:text-sm text-gray-400">
                                🕒 {tarih}
                              </span>
                            )}

                            {link && (
                              <span className="text-xs sm:text-sm text-blue-600 font-bold">
                                Görüntüle →
                              </span>
                            )}

                          </div>
                        </button>

                        {/* =====================
                            SİL
                        ===================== */}

                        <button
                          type="button"
                          disabled={
                            silinenId ===
                            bildirim.id
                          }
                          onClick={() => {
                            bildirimSil(
                              bildirim.id
                            );
                          }}
                          className="shrink-0 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 text-red-600 w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-bold"
                          title="Bildirimi sil"
                        >
                          {silinenId ===
                          bildirim.id
                            ? "⏳"
                            : "🗑️"}
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