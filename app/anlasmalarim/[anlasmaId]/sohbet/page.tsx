"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  reload,
  User,
} from "firebase/auth";
import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  auth,
  db,
} from "../../../firebase";

type TeklifTuru = "normal" | "arac";

type SohbetTeklif = {
  id: string;
  teklifTuru: TeklifTuru;

  nakliyeciId?: string;
  ilanSahibiId?: string;

  yukSahibiId?: string;
  aracSahibiId?: string;

  teklifFiyati?: number;
  fiyat?: number;
  yukFiyati?: number;

  paraBirimi?: string;
  mesaj?: string;

  userId?: string;
  kullaniciId?: string;

  [key: string]: any;
};

export default function SohbetPage() {
  const params = useParams();
  const router = useRouter();

  const anlasmaId = String(
    params.anlasmaId || ""
  );

  const [user, setUser] =
    useState<User | null>(null);

  const [anlasma, setAnlasma] =
    useState<any>(null);

  const [ilan, setIlan] =
    useState<any>(null);

  const [teklif, setTeklif] =
    useState<SohbetTeklif | null>(
      null
    );

  const [mesajlar, setMesajlar] =
    useState<any[]>([]);

  const [mesaj, setMesaj] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    gonderiliyor,
    setGonderiliyor,
  ] = useState(false);

  const [hata, setHata] =
    useState("");

  const [
    mesajHatasi,
    setMesajHatasi,
  ] = useState("");

  // ==========================================
  // SOHBETİ YÜKLE
  // ==========================================

  useEffect(() => {
    let unsubscribeMesajlar:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (!currentUser) {
            router.push("/login");
            return;
          }

          try {
            await reload(currentUser);

            await currentUser.getIdToken(
              true
            );
          } catch {
            // Kullanıcı yine de kullanılabilir.
          }

          const guncelUser =
            auth.currentUser ||
            currentUser;

          setUser(guncelUser);

          try {
            setLoading(true);
            setHata("");
            setMesajHatasi("");

            // ==================================
            // 1 - ANLAŞMAYI BUL
            // ==================================

            const anlasmaRef = doc(
              db,
              "anlasmalar",
              anlasmaId
            );

            const anlasmaSnap =
              await getDoc(anlasmaRef);

            if (!anlasmaSnap.exists()) {
              setHata(
                "Bu taşıma anlaşması bulunamadı."
              );

              setLoading(false);
              return;
            }

            const bulunanAnlasma: any = {
              id: anlasmaSnap.id,
              ...anlasmaSnap.data(),
            };

            // ==================================
            // 2 - ANLAŞMA TARAF KONTROLÜ
            // ==================================

            const ilanSahibiId =
              String(
                bulunanAnlasma.ilanSahibiId ||
                  ""
              );

            const nakliyeciId =
              String(
                bulunanAnlasma.nakliyeciId ||
                  ""
              );

            if (
              guncelUser.uid !==
                ilanSahibiId &&
              guncelUser.uid !==
                nakliyeciId
            ) {
              setHata(
                "Bu sohbete erişim yetkin yok."
              );

              setLoading(false);
              return;
            }

            // ==================================
            // 3 - YÜK İLANINI BUL
            // ==================================

            const ilanId = String(
              bulunanAnlasma.ilanId ||
                anlasmaId
            );

            if (!ilanId) {
              setHata(
                "Anlaşmaya ait yük bilgisi bulunamadı."
              );

              setLoading(false);
              return;
            }

            const ilanRef = doc(
              db,
              "yukler",
              ilanId
            );

            const ilanSnap =
              await getDoc(ilanRef);

            if (!ilanSnap.exists()) {
              setHata(
                "Anlaşmaya ait yük ilanı bulunamadı."
              );

              setLoading(false);
              return;
            }

            const bulunanIlan: any = {
              id: ilanSnap.id,
              ...ilanSnap.data(),
            };

            if (
              bulunanIlan.durum !==
                "Anlaşıldı" &&
              bulunanIlan.durum !==
                "Tamamlandı"
            ) {
              setHata(
                "Bu ilan henüz aktif bir anlaşmaya dönüşmemiş."
              );

              setLoading(false);
              return;
            }

            // ==================================
            // 4 - TEKLİF ID
            // ==================================

            const teklifId = String(
              bulunanAnlasma.teklifId ||
                bulunanIlan.kabulEdilenTeklifId ||
                ""
            );

            if (!teklifId) {
              setHata(
                "Kabul edilen teklif bilgisi bulunamadı."
              );

              setLoading(false);
              return;
            }

            // ==================================
            // 5 - TEKLİF TÜRÜ
            // ==================================

            const anlasmaTeklifTuru:
              TeklifTuru =
              bulunanAnlasma.teklifTuru ===
              "arac"
                ? "arac"
                : "normal";

            // Burada artık null kullanmıyoruz.
            // TypeScript hatasının ana çözümü bu.

            let bulunanTeklif:
              SohbetTeklif;

            // ==================================
            // 6A - ARAÇ TEKLİFİ
            // ==================================

            if (
              anlasmaTeklifTuru ===
              "arac"
            ) {
              const aracTeklifRef = doc(
                db,
                "aracTeklifleri",
                teklifId
              );

              const aracTeklifSnap =
                await getDoc(
                  aracTeklifRef
                );

              if (
                !aracTeklifSnap.exists()
              ) {
                setHata(
                  "Kabul edilen araç yük teklifi bulunamadı."
                );

                setLoading(false);
                return;
              }

              bulunanTeklif = {
                id: aracTeklifSnap.id,
                teklifTuru: "arac",
                ...aracTeklifSnap.data(),
              };

              const yukSahibiId =
                String(
                  bulunanTeklif.yukSahibiId ||
                    ilanSahibiId
                );

              const aracSahibiId =
                String(
                  bulunanTeklif.aracSahibiId ||
                    nakliyeciId
                );

              // =================================
              // ARAÇ TEKLİFİ TARAF KONTROLÜ
              // =================================

              if (
                guncelUser.uid !==
                  yukSahibiId &&
                guncelUser.uid !==
                  aracSahibiId
              ) {
                setHata(
                  "Bu araç teklifinin sohbetine erişim yetkin yok."
                );

                setLoading(false);
                return;
              }

              if (
                yukSahibiId !==
                  ilanSahibiId ||
                aracSahibiId !==
                  nakliyeciId
              ) {
                setHata(
                  "Anlaşma ile araç teklifi bilgileri uyuşmuyor."
                );

                setLoading(false);
                return;
              }
            } else {
              // ==================================
              // 6B - NORMAL TEKLİF
              // ==================================

              const normalTeklifRef =
                doc(
                  db,
                  "teklifler",
                  teklifId
                );

              const normalTeklifSnap =
                await getDoc(
                  normalTeklifRef
                );

              if (
                !normalTeklifSnap.exists()
              ) {
                setHata(
                  "Kabul edilen teklif bulunamadı."
                );

                setLoading(false);
                return;
              }

              bulunanTeklif = {
                id: normalTeklifSnap.id,
                teklifTuru: "normal",
                ...normalTeklifSnap.data(),
              };

              const teklifIlanSahibiId =
                String(
                  bulunanTeklif.ilanSahibiId ||
                    ilanSahibiId
                );

              const teklifVerenId =
                String(
                  bulunanTeklif.nakliyeciId ||
                    bulunanTeklif.userId ||
                    bulunanTeklif.kullaniciId ||
                    nakliyeciId
                );

              // =================================
              // NORMAL TEKLİF TARAF KONTROLÜ
              // =================================

              if (
                guncelUser.uid !==
                  teklifIlanSahibiId &&
                guncelUser.uid !==
                  teklifVerenId
              ) {
                setHata(
                  "Bu teklifin sohbetine erişim yetkin yok."
                );

                setLoading(false);
                return;
              }

              if (
                teklifIlanSahibiId !==
                  ilanSahibiId ||
                teklifVerenId !==
                  nakliyeciId
              ) {
                setHata(
                  "Anlaşma ile teklif bilgileri uyuşmuyor."
                );

                setLoading(false);
                return;
              }
            }

            // ==================================
            // 7 - STATE
            // ==================================

            setAnlasma(
              bulunanAnlasma
            );

            setIlan(
              bulunanIlan
            );

            setTeklif(
              bulunanTeklif
            );

            // ==================================
            // 8 - MESAJLARI DİNLE
            //
            // sohbet ID = teklif ID
            // ==================================

            const mesajQuery = query(
              collection(
                db,
                "sohbetler",
                bulunanTeklif.id,
                "mesajlar"
              ),
              orderBy(
                "tarih",
                "asc"
              )
            );

            unsubscribeMesajlar =
              onSnapshot(
                mesajQuery,
                (snapshot) => {
                  const liste =
                    snapshot.docs.map(
                      (item) => ({
                        id: item.id,
                        ...item.data(),
                      })
                    );

                  setMesajlar(
                    liste
                  );
                },
                (error) => {
                  console.error(
                    "Mesaj dinleme hatası:",
                    error
                  );

                  if (
                    error?.code ===
                    "permission-denied"
                  ) {
                    setMesajHatasi(
                      "Mesajları görüntülemeye Firebase izin vermedi."
                    );
                  } else {
                    setMesajHatasi(
                      "Mesajlar alınırken bir hata oluştu."
                    );
                  }
                }
              );

            setLoading(false);
          } catch (error: any) {
            console.error(
              "Sohbet yükleme hatası:",
              error
            );

            if (
              error?.code ===
              "permission-denied"
            ) {
              setHata(
                "Sohbet yüklenemedi. Firebase bu işleme izin vermedi."
              );
            } else {
              setHata(
                "Sohbet yüklenirken bir hata oluştu."
              );
            }

            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribeAuth();

      if (unsubscribeMesajlar) {
        unsubscribeMesajlar();
      }
    };
  }, [anlasmaId, router]);

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster() {
    const paraBirimi =
      anlasma?.paraBirimi ||
      teklif?.paraBirimi ||
      ilan?.kabulEdilenParaBirimi ||
      ilan?.paraBirimi ||
      "TRY";

    const sembol =
      paraBirimi === "USD"
        ? "$"
        : paraBirimi === "EUR"
        ? "€"
        : "₺";

    const fiyat =
      anlasma?.fiyat ||
      teklif?.teklifFiyati ||
      teklif?.fiyat ||
      teklif?.yukFiyati ||
      ilan?.kabulEdilenFiyat ||
      ilan?.fiyat ||
      0;

    return `${sembol}${Number(
      fiyat
    ).toLocaleString("tr-TR")}`;
  }

  // ==========================================
  // BİLDİRİM OLUŞTUR
  // ==========================================

  async function bildirimOlustur({
    kullaniciId,
    baslik,
    mesaj,
    hedef,
  }: {
    kullaniciId: string;
    baslik: string;
    mesaj: string;
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

          tip: "yeni_mesaj",

          hedef,

          okundu: false,

          createdAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Mesaj bildirimi oluşturulamadı:",
        error
      );

      // Bildirim hatası
      // mesaj gönderimini bozmasın.
    }
  }

  // ==========================================
  // KARŞI TARAF ID
  // ==========================================

  function karsiTarafIdBul() {
    if (
      !user ||
      !anlasma
    ) {
      return "";
    }

    const ilanSahibiId =
      String(
        anlasma.ilanSahibiId ||
          ""
      );

    const nakliyeciId =
      String(
        anlasma.nakliyeciId ||
          ""
      );

    if (
      user.uid ===
      ilanSahibiId
    ) {
      return nakliyeciId;
    }

    if (
      user.uid ===
      nakliyeciId
    ) {
      return ilanSahibiId;
    }

    return "";
  }

  // ==========================================
  // MESAJ GÖNDER
  // ==========================================

  async function mesajGonder() {
    if (
      !user ||
      !teklif ||
      !ilan ||
      !anlasma
    ) {
      return;
    }

    if (gonderiliyor) {
      return;
    }

    setMesajHatasi("");

    const temizMesaj =
      mesaj.trim();

    if (!temizMesaj) {
      return;
    }

    if (
      temizMesaj.length >
      1000
    ) {
      setMesajHatasi(
        "Mesaj en fazla 1000 karakter olabilir."
      );

      return;
    }

    const bildirimAliciId =
      karsiTarafIdBul();

    if (!bildirimAliciId) {
      setMesajHatasi(
        "Mesajın gönderileceği karşı taraf bulunamadı."
      );

      return;
    }

    try {
      setGonderiliyor(
        true
      );

      // ======================================
      // MESAJI KAYDET
      // ======================================

      await addDoc(
        collection(
          db,
          "sohbetler",
          teklif.id,
          "mesajlar"
        ),
        {
          mesaj:
            temizMesaj,

          gonderenId:
            user.uid,

          gonderenEmail:
            user.email || "",

          tarih:
            serverTimestamp(),
        }
      );

      setMesaj("");

      // ======================================
      // KARŞI TARAFA BİLDİRİM
      // ======================================

      await bildirimOlustur({
        kullaniciId:
          bildirimAliciId,

        baslik:
          "💬 Yeni Mesaj",

        mesaj: `${
          ilan.nereden ||
          "Yük"
        } → ${
          ilan.nereye ||
          ""
        } taşıması için yeni mesajın var.`,

        hedef:
          `/anlasmalarim/${anlasmaId}/sohbet`,
      });
    } catch (error: any) {
      console.error(
        "Mesaj gönderme hatası:",
        error
      );

      if (
        error?.code ===
        "permission-denied"
      ) {
        setMesajHatasi(
          "Mesaj gönderilemedi. Firebase bu işleme izin vermedi."
        );
      } else {
        setMesajHatasi(
          "Mesaj gönderilemedi. Lütfen tekrar dene."
        );
      }
    } finally {
      setGonderiliyor(
        false
      );
    }
  }

  // ==========================================
  // ENTER İLE GÖNDER
  // ==========================================

  function enterKontrol(
    event:
      React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      !gonderiliyor
    ) {
      event.preventDefault();

      mesajGonder();
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-6xl mb-4">
            💬
          </div>

          <h1 className="text-2xl font-extrabold">
            Sohbet yükleniyor...
          </h1>
        </div>
      </main>
    );
  }

  // ==========================================
  // HATA
  // ==========================================

  if (hata) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="text-6xl mb-5">
            ⚠️
          </div>

          <h1 className="text-2xl font-extrabold text-red-600">
            Sohbet Açılamadı
          </h1>

          <p className="text-gray-600 mt-4">
            {hata}
          </p>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/anlasmalarim"
              );
            }}
            className="mt-7 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← Anlaşmalarıma Dön
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // SAYFA BİLGİLERİ
  // ==========================================

  const aracTeklifinden =
    teklif?.teklifTuru ===
    "arac";

  const benYukSahibiyim =
    user?.uid ===
    anlasma?.ilanSahibiId;

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* ==================================
              ÜST BAŞLIK
          ================================== */}

          <div className="bg-blue-600 text-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold">
                  💬 Taşıma Sohbeti
                </h1>

                <p className="mt-2 text-blue-100 break-words">
                  {ilan?.nereden ||
                    "Bilinmiyor"}{" "}
                  →{" "}
                  {ilan?.nereye ||
                    "Bilinmiyor"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/anlasmalarim"
                  );
                }}
                className="shrink-0 bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-xl font-bold"
              >
                ← Geri
              </button>
            </div>
          </div>

          {/* ==================================
              ANLAŞMA BİLGİSİ
          ================================== */}

          <div className="p-4 sm:p-6 border-b">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div>
                  <p className="text-green-700 font-extrabold text-lg">
                    🤝 Taşıma Anlaşması
                  </p>

                  <p className="text-gray-600 mt-2">
                    📍{" "}
                    {ilan?.nereden ||
                      "Bilinmiyor"}{" "}
                    →{" "}
                    {ilan?.nereye ||
                      "Bilinmiyor"}
                  </p>

                  <p className="text-gray-600 mt-1">
                    📦{" "}
                    {ilan?.yukTuru ||
                      "Yük türü belirtilmemiş"}
                  </p>

                  {ilan?.agirlik && (
                    <p className="text-gray-600 mt-1">
                      ⚖️{" "}
                      {ilan.agirlik}
                    </p>
                  )}
                </div>

                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">
                    Anlaşılan Fiyat
                  </p>

                  <p className="text-2xl font-extrabold text-green-600">
                    {fiyatGoster()}
                  </p>
                </div>
              </div>
            </div>

            {/* ANLAŞMA TÜRÜ */}

            <div className="mt-4 flex flex-wrap gap-2">
              {aracTeklifinden ? (
                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold text-sm">
                  🚛 Boş Araç Üzerinden Anlaşma
                </span>
              ) : (
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold text-sm">
                  📦 Yük İlanı Üzerinden Anlaşma
                </span>
              )}

              <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-bold text-sm">
                {benYukSahibiyim
                  ? "📦 Sen Yük Sahibisin"
                  : "🚛 Sen Taşıyıcısın"}
              </span>

              {anlasma?.durum && (
                <span
                  className={`px-4 py-2 rounded-full font-bold text-sm ${
                    anlasma.durum ===
                    "Tamamlandı"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {anlasma.durum ===
                  "Tamamlandı"
                    ? "✅ Tamamlandı"
                    : "🟢 Aktif Anlaşma"}
                </span>
              )}
            </div>
          </div>

          {/* ==================================
              SOHBET
          ================================== */}

          <div className="p-4 sm:p-6">

            {mesajHatasi !== "" && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4 font-semibold">
                ⚠️ {mesajHatasi}
              </div>
            )}

            {/* MESAJ LİSTESİ */}

            <div className="h-[430px] sm:h-[500px] overflow-y-auto bg-gray-50 rounded-2xl p-3 sm:p-5 space-y-4">

              {mesajlar.length ===
              0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <div className="text-6xl mb-4">
                      💬
                    </div>

                    <p className="text-xl font-extrabold">
                      Henüz mesaj yok
                    </p>

                    <p className="text-gray-500 mt-2">
                      Taşıma hakkında konuşmaya başlayın.
                    </p>
                  </div>
                </div>
              ) : (
                mesajlar.map(
                  (item) => {
                    const benimMesajim =
                      item.gonderenId ===
                      user?.uid;

                    return (
                      <div
                        key={item.id}
                        className={`flex ${
                          benimMesajim
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 sm:px-5 py-3 ${
                            benimMesajim
                              ? "bg-blue-600 text-white"
                              : "bg-white border text-gray-800"
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">
                            {item.mesaj}
                          </p>

                          <p
                            className={`text-xs mt-2 break-all ${
                              benimMesajim
                                ? "text-blue-100"
                                : "text-gray-400"
                            }`}
                          >
                            {benimMesajim
                              ? "Sen"
                              : item.gonderenEmail ||
                                "Kullanıcı"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>

            {/* ==================================
                MESAJ GÖNDER
            ================================== */}

            <div className="mt-5">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={mesaj}
                  maxLength={1000}
                  onChange={(event) => {
                    setMesaj(
                      event.currentTarget
                        .value
                    );
                  }}
                  onKeyDown={
                    enterKontrol
                  }
                  placeholder="Mesajını yaz..."
                  disabled={
                    gonderiliyor
                  }
                  className="min-w-0 flex-1 border rounded-2xl px-4 sm:px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={
                    mesajGonder
                  }
                  disabled={
                    gonderiliyor ||
                    mesaj.trim() === ""
                  }
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 sm:px-7 rounded-2xl font-extrabold"
                >
                  {gonderiliyor
                    ? "..."
                    : "📤 Gönder"}
                </button>
              </div>

              <div className="flex justify-between gap-3 mt-2 px-1">
                <p className="text-xs text-gray-400">
                  Enter ile de gönderebilirsin.
                </p>

                <p
                  className={`text-xs ${
                    mesaj.length > 900
                      ? "text-orange-600 font-bold"
                      : "text-gray-400"
                  }`}
                >
                  {mesaj.length}/1000
                </p>
              </div>
            </div>

            {/* ==================================
                ALT BUTONLAR
            ================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7 pt-6 border-t">

              <button
                type="button"
                onClick={() => {
                  router.push(
                    "/anlasmalarim"
                  );
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                🤝 Anlaşmalarım
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(
                    `/ilan/${ilan?.id}`
                  );
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-bold"
              >
                🔎 Yük İlanı
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push("/");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                🏠 Ana Sayfa
              </button>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}