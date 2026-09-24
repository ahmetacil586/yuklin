"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "./firebase";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

export default function Header() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState("");

  const [menuAcik, setMenuAcik] =
    useState(false);

  const [
    bildirimAcik,
    setBildirimAcik,
  ] = useState(false);

  const [
    authYukleniyor,
    setAuthYukleniyor,
  ] = useState(true);

  const [
    bildirimler,
    setBildirimler,
  ] = useState<any[]>([]);

  // ==========================================
  // KULLANICI + BİLDİRİMLER
  // ==========================================

  useEffect(() => {
    let unsubscribeBildirimler:
      | (() => void)
      | null = null;

    const mevcutUser =
      auth.currentUser;

    if (mevcutUser) {
      setUser(mevcutUser);
    }

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);

          setAuthYukleniyor(false);

          if (
            unsubscribeBildirimler
          ) {
            unsubscribeBildirimler();

            unsubscribeBildirimler =
              null;
          }

          if (!currentUser) {
            setRole("");
            setBildirimler([]);
            return;
          }

          // ======================================
          // KULLANICI ROLÜ
          // ======================================

          try {
            const userRef =
              doc(
                db,
                "users",
                currentUser.uid
              );

            const userDoc =
              await getDoc(
                userRef
              );

            if (
              userDoc.exists()
            ) {
              const userData =
                userDoc.data();

              setRole(
                userData.role ||
                  ""
              );
            } else {
              setRole("");
            }
          } catch {
            setRole("");
          }

          // ======================================
          // BİLDİRİMLER
          // ======================================

          try {
            const bildirimQuery =
              query(
                collection(
                  db,
                  "bildirimler"
                ),
                where(
                  "kullaniciId",
                  "==",
                  currentUser.uid
                )
              );

            unsubscribeBildirimler =
              onSnapshot(
                bildirimQuery,
                (snapshot) => {
                  const liste =
                    snapshot.docs.map(
                      (item) => ({
                        id: item.id,
                        ...item.data(),
                      })
                    );

                  liste.sort(
                    (
                      a: any,
                      b: any
                    ) => {
                      const aTarih =
                        a.createdAt
                          ?.seconds ||
                        a.olusturulmaTarihi
                          ?.seconds ||
                        a.tarih
                          ?.seconds ||
                        0;

                      const bTarih =
                        b.createdAt
                          ?.seconds ||
                        b.olusturulmaTarihi
                          ?.seconds ||
                        b.tarih
                          ?.seconds ||
                        0;

                      return (
                        bTarih -
                        aTarih
                      );
                    }
                  );

                  setBildirimler(
                    liste
                  );
                },
                () => {
                  setBildirimler(
                    []
                  );
                }
              );
          } catch {
            setBildirimler(
              []
            );
          }
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
  }, []);

  // ==========================================
  // OKUNMAMIŞ SAYISI
  // ==========================================

  const okunmamisSayisi =
    bildirimler.filter(
      (bildirim) =>
        bildirim.okundu !==
        true
    ).length;

  // ==========================================
  // BİLDİRİM İKONU
  // ==========================================

  function bildirimIkonu(
    tip: string
  ) {
    if (
      tip ===
      "teklif_kabul"
    ) {
      return "🎉";
    }

    if (
      tip ===
      "teklif_reddedildi"
    ) {
      return "❌";
    }

    if (
      tip ===
      "yeni_mesaj"
    ) {
      return "💬";
    }

    if (
      tip ===
      "yeni_teklif"
    ) {
      return "💰";
    }

    if (
      tip ===
      "degerlendirme"
    ) {
      return "⭐";
    }

    if (
      tip ===
      "teslimat"
    ) {
      return "🚚";
    }

    return "🔔";
  }

  // ==========================================
  // BİLDİRİME TIKLA
  // ==========================================

  async function bildirimeTikla(
    bildirim: any
  ) {
    try {
      if (
        bildirim.okundu !==
        true
      ) {
        await updateDoc(
          doc(
            db,
            "bildirimler",
            bildirim.id
          ),
          {
            okundu:
              true,
          }
        );
      }
    } catch {
      // Bildirim okunamadıysa
      // yönlendirme yine devam eder.
    }

    setBildirimAcik(
      false
    );

    setMenuAcik(
      false
    );

    if (
      typeof bildirim.hedef ===
        "string" &&
      bildirim.hedef !==
        ""
    ) {
      router.push(
        bildirim.hedef
      );

      return;
    }

    if (
      typeof bildirim.link ===
        "string" &&
      bildirim.link !==
        ""
    ) {
      router.push(
        bildirim.link
      );
    }
  }

  // ==========================================
  // TÜMÜNÜ OKUNDU YAP
  // ==========================================

  async function tumunuOkunduYap() {
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
      return;
    }

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
                okundu:
                  true,
              }
            )
        )
      );
    } catch {
      // Sayfa çalışmaya devam etsin.
    }
  }

  // ==========================================
  // BİLDİRİMLER SAYFASINA GİT
  // ==========================================

  function tumBildirimlereGit() {
    setBildirimAcik(
      false
    );

    setMenuAcik(
      false
    );

    router.push(
      "/bildirimler"
    );
  }

  // ==========================================
  // ÇIKIŞ
  // ==========================================

  async function cikisYap() {
    try {
      await signOut(
        auth
      );

      setUser(null);
      setRole("");
      setMenuAcik(false);

      setBildirimAcik(
        false
      );

      setBildirimler([]);

      router.push("/");
    } catch {
      // Çıkış hatası olursa
      // uygulama açık kalır.
    }
  }

  // ==========================================
  // ROL
  // ==========================================

  function rolGoster() {
    if (
      role ===
      "nakliyeci"
    ) {
      return "🚛 Nakliyeci";
    }

    if (
      role ===
      "yuk_sahibi"
    ) {
      return "📦 Yük Sahibi";
    }

    return "👤 Kullanıcı";
  }

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-4 lg:px-5 py-2">

        <div className="flex items-center justify-between gap-3">

          {/* ======================================
              LOGO
          ====================================== */}

          <Link
            href="/"
            className="block shrink-0"
            onClick={() => {
              setMenuAcik(
                false
              );

              setBildirimAcik(
                false
              );
            }}
          >

            <img
              src="/yuklin-logo.png"
              alt="YÜKLİN"
              className="h-10 sm:h-11 lg:h-12 w-auto object-contain"
            />

          </Link>

          {/* ======================================
              MASAÜSTÜ MENÜ
          ====================================== */}

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 font-semibold text-sm">

            <Link
              href="/"
              className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
            >
              Ana Sayfa
            </Link>

            <Link
              href="/yuk-ver"
              className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
            >
              📦 Yük İlanı
            </Link>

            <Link
              href="/ilanlar"
              className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
            >
              📋 Yük İlanları
            </Link>

            <Link
              href="/bos-arac"
              className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
            >
              🚛 Boş Araç
            </Link>

            {!authYukleniyor &&
              user && (
                <>

                  <Link
                    href="/benim-ilanlarim"
                    className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
                  >
                    📦 İlanlarım
                  </Link>

                  <Link
                    href="/tekliflerim"
                    className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
                  >
                    💰 Tekliflerim
                  </Link>

                  <Link
                    href="/gelen-teklifler"
                    className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
                  >
                    📥 Gelen Teklifler
                  </Link>

                  <Link
                    href="/anlasmalarim"
                    className="px-3 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition font-extrabold whitespace-nowrap"
                  >
                    🤝 Anlaşmalarım
                  </Link>

                  <Link
                    href="/profil"
                    className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
                  >
                    👤 Profilim
                  </Link>

                </>
              )}

          </nav>

          {/* ======================================
              SAĞ TARAF
          ====================================== */}

          <div className="flex items-center gap-2 shrink-0">

            {authYukleniyor ? (

              <div className="w-24 h-10 bg-gray-100 rounded-xl animate-pulse" />

            ) : !user ? (

              <>

                <Link
                  href="/login"
                  className="border border-blue-600 px-3 lg:px-4 py-2 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition text-sm lg:text-base"
                >
                  Giriş Yap
                </Link>

                <Link
                  href="/register"
                  className="bg-blue-600 px-3 lg:px-4 py-2 rounded-xl text-white font-bold hover:bg-blue-700 transition text-sm lg:text-base"
                >
                  Kayıt Ol
                </Link>

              </>

            ) : (

              <>

                {/* ==================================
                    BİLDİRİM ZİLİ
                ================================== */}

                <div className="relative">

                  <button
                    type="button"
                    onClick={() => {
                      setBildirimAcik(
                        !bildirimAcik
                      );

                      setMenuAcik(
                        false
                      );
                    }}
                    className="relative w-11 h-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-xl transition"
                    title="Bildirimler"
                  >
                    🔔

                    {okunmamisSayisi >
                      0 && (

                      <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-extrabold border-2 border-white">
                        {okunmamisSayisi >
                        99
                          ? "99+"
                          : okunmamisSayisi}
                      </span>

                    )}

                  </button>

                  {/* ==================================
                      BİLDİRİM PANELİ
                  ================================== */}

                  {bildirimAcik && (

                    <div className="absolute right-0 mt-3 w-[330px] sm:w-[390px] max-w-[calc(100vw-24px)] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-[200]">

                      {/* ÜST */}

                      <div className="p-4 border-b flex items-center justify-between gap-3">

                        <div>

                          <p className="font-extrabold text-lg">
                            🔔 Bildirimler
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {okunmamisSayisi} okunmamış bildirim
                          </p>

                        </div>

                        {okunmamisSayisi >
                          0 && (

                          <button
                            type="button"
                            onClick={
                              tumunuOkunduYap
                            }
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-bold"
                          >
                            Tümünü okundu yap
                          </button>

                        )}

                      </div>

                      {/* LİSTE */}

                      <div className="max-h-[380px] overflow-y-auto">

                        {bildirimler.length ===
                        0 ? (

                          <div className="p-10 text-center">

                            <div className="text-5xl mb-3">
                              🔕
                            </div>

                            <p className="font-extrabold">
                              Bildirimin yok
                            </p>

                            <p className="text-sm text-gray-500 mt-2">
                              Yeni teklif veya mesaj geldiğinde burada göreceksin.
                            </p>

                          </div>

                        ) : (

                          bildirimler
                            .slice(
                              0,
                              8
                            )
                            .map(
                              (
                                bildirim
                              ) => (

                                <button
                                  key={
                                    bildirim.id
                                  }
                                  type="button"
                                  onClick={() => {
                                    bildirimeTikla(
                                      bildirim
                                    );
                                  }}
                                  className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-gray-50 transition ${
                                    bildirim.okundu !==
                                    true
                                      ? "bg-blue-50"
                                      : "bg-white"
                                  }`}
                                >

                                  <div className="flex gap-3">

                                    <div className="text-2xl shrink-0">
                                      {bildirimIkonu(
                                        bildirim.tip ||
                                          bildirim.tur ||
                                          ""
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <div className="flex items-start justify-between gap-2">

                                        <p className="font-extrabold text-gray-900">
                                          {bildirim.baslik ||
                                            "Bildirim"}
                                        </p>

                                        {bildirim.okundu !==
                                          true && (

                                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />

                                        )}

                                      </div>

                                      <p className="text-sm text-gray-600 mt-1 break-words">
                                        {bildirim.mesaj ||
                                          bildirim.aciklama ||
                                          ""}
                                      </p>

                                    </div>

                                  </div>

                                </button>

                              )
                            )

                        )}

                      </div>

                      {/* ==================================
                          TÜM BİLDİRİMLER
                      ================================== */}

                      <div className="p-3 border-t bg-gray-50">

                        <button
                          type="button"
                          onClick={
                            tumBildirimlereGit
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-extrabold transition"
                        >
                          🔔 Tüm Bildirimleri Gör
                        </button>

                      </div>

                    </div>

                  )}

                </div>

                {/* ==================================
                    HESAP MENÜSÜ
                ================================== */}

                <div className="relative">

                  <button
                    type="button"
                    onClick={() => {
                      setMenuAcik(
                        !menuAcik
                      );

                      setBildirimAcik(
                        false
                      );
                    }}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 lg:px-4 py-2 rounded-xl font-bold transition"
                  >

                    👤

                    <span className="hidden xl:inline">
                      Hesabım
                    </span>

                    <span>
                      {menuAcik
                        ? "▲"
                        : "▼"}
                    </span>

                  </button>

                  {menuAcik && (

                    <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-[100]">

                      {/* HESAP BİLGİSİ */}

                      <div className="bg-blue-50 rounded-xl p-4 mb-2">

                        <p className="font-extrabold text-blue-700">
                          {rolGoster()}
                        </p>

                        <p className="text-sm text-gray-500 mt-1 break-all">
                          {user.email}
                        </p>

                      </div>

                      {/* PROFİL */}

                      <Link
                        href="/profil"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 font-semibold"
                      >
                        👤 Profilim
                      </Link>

                      {/* İLANLAR */}

                      <Link
                        href="/benim-ilanlarim"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 font-semibold"
                      >
                        📦 İlanlarım
                      </Link>

                      {/* TEKLİFLER */}

                      <Link
                        href="/tekliflerim"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 font-semibold"
                      >
                        💰 Tekliflerim
                      </Link>

                      {/* GELEN TEKLİFLER */}

                      <Link
                        href="/gelen-teklifler"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl hover:bg-gray-100 font-semibold"
                      >
                        📥 Gelen Teklifler
                      </Link>

                      {/* ANLAŞMALAR */}

                      <Link
                        href="/anlasmalarim"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-extrabold"
                      >
                        🤝 Anlaşmalarım
                      </Link>

                      {/* BİLDİRİMLER */}

                      <Link
                        href="/bildirimler"
                        onClick={() => {
                          setMenuAcik(
                            false
                          );
                        }}
                        className="block px-4 py-3 rounded-xl hover:bg-blue-50 text-blue-700 font-semibold mt-1"
                      >
                        🔔 Bildirimlerim

                        {okunmamisSayisi >
                          0 && (

                          <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                            {okunmamisSayisi >
                            99
                              ? "99+"
                              : okunmamisSayisi}
                          </span>

                        )}

                      </Link>

                      <div className="border-t my-2" />

                      {/* ÇIKIŞ */}

                      <button
                        type="button"
                        onClick={
                          cikisYap
                        }
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 font-bold"
                      >
                        🚪 Çıkış Yap
                      </button>

                    </div>

                  )}

                </div>

              </>

            )}

          </div>

        </div>

      </div>

    </header>
  );
}