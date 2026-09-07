"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../firebase";

export default function SohbetPage() {
  const params = useParams();
  const router = useRouter();

  // ÖNEMLİ:
  // Klasörümüz [anlasmaId] olduğu için params.anlasmaId kullanıyoruz.
  const anlasmaId = String(params.anlasmaId);

  const [user, setUser] = useState<any>(null);
  const [ilan, setIlan] = useState<any>(null);
  const [teklif, setTeklif] = useState<any>(null);

  const [mesajlar, setMesajlar] = useState<any[]>([]);
  const [mesaj, setMesaj] = useState("");

  const [loading, setLoading] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");

  useEffect(() => {
    let unsubscribeMesajlar: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);

        try {
          setLoading(true);
          setHata("");

          let bulunanTeklif: any = null;
          let bulunanIlan: any = null;

          /*
           * 1. Önce URL'deki ID'yi TEKLİF ID'si olarak deniyoruz.
           */

          const teklifRef = doc(
            db,
            "teklifler",
            anlasmaId
          );

          const teklifSnap = await getDoc(teklifRef);

          if (teklifSnap.exists()) {
            bulunanTeklif = {
              id: teklifSnap.id,
              ...teklifSnap.data(),
            };
          }

          /*
           * 2. Teklif bulunamadıysa URL'deki ID'yi
           *    İLAN ID'si olarak deniyoruz.
           */

          if (!bulunanTeklif) {
            const ilanRef = doc(
              db,
              "yukler",
              anlasmaId
            );

            const ilanSnap = await getDoc(ilanRef);

            if (ilanSnap.exists()) {
              bulunanIlan = {
                id: ilanSnap.id,
                ...ilanSnap.data(),
              };

              /*
               * İlanda kabul edilen teklif ID'si varsa
               * direkt onu getiriyoruz.
               */

              if (
                bulunanIlan.kabulEdilenTeklifId
              ) {
                const kabulTeklifRef = doc(
                  db,
                  "teklifler",
                  bulunanIlan.kabulEdilenTeklifId
                );

                const kabulTeklifSnap =
                  await getDoc(kabulTeklifRef);

                if (kabulTeklifSnap.exists()) {
                  bulunanTeklif = {
                    id: kabulTeklifSnap.id,
                    ...kabulTeklifSnap.data(),
                  };
                }
              }

              /*
               * ID yoksa ilanId + Kabul Edildi ile arıyoruz.
               */

              if (!bulunanTeklif) {
                const teklifQuery = query(
                  collection(db, "teklifler"),
                  where(
                    "ilanId",
                    "==",
                    bulunanIlan.id
                  ),
                  where(
                    "durum",
                    "==",
                    "Kabul Edildi"
                  )
                );

                const teklifSnapshot =
                  await getDocs(teklifQuery);

                if (
                  !teklifSnapshot.empty
                ) {
                  const item =
                    teklifSnapshot.docs[0];

                  bulunanTeklif = {
                    id: item.id,
                    ...item.data(),
                  };
                }
              }
            }
          }

          /*
           * 3. Teklif bulundu ama ilan bulunamadıysa
           *    teklif içindeki ilanId ile ilanı getiriyoruz.
           */

          if (
            bulunanTeklif &&
            !bulunanIlan &&
            bulunanTeklif.ilanId
          ) {
            const ilanRef = doc(
              db,
              "yukler",
              bulunanTeklif.ilanId
            );

            const ilanSnap = await getDoc(
              ilanRef
            );

            if (ilanSnap.exists()) {
              bulunanIlan = {
                id: ilanSnap.id,
                ...ilanSnap.data(),
              };
            }
          }

          /*
           * 4. İlan veya teklif yoksa hata göster.
           */

          if (
            !bulunanIlan ||
            !bulunanTeklif
          ) {
            setHata(
              "Bu taşıma anlaşması bulunamadı. Lütfen Anlaşmalarım sayfasından tekrar Sohbete Git butonuna bas."
            );

            setLoading(false);
            return;
          }

          /*
           * 5. Sohbete sadece iki taraf girebilir:
           *
           * ilan sahibi
           * nakliyeci
           */

          const ilanSahibiId =
            bulunanIlan.userId;

          const nakliyeciId =
            bulunanTeklif.nakliyeciId ||
            bulunanTeklif.userId ||
            bulunanTeklif.kullaniciId;

          if (
            currentUser.uid !==
              ilanSahibiId &&
            currentUser.uid !==
              nakliyeciId
          ) {
            setHata(
              "Bu sohbete erişim yetkin yok."
            );

            setLoading(false);
            return;
          }

          setIlan(bulunanIlan);
          setTeklif(bulunanTeklif);

          /*
           * 6. MESAJLAR
           *
           * Sohbet ID'si:
           * kabul edilmiş teklif ID'si
           */

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

                setMesajlar(liste);
              },
              (error) => {
                console.error(
                  "Mesajlar alınamadı:",
                  error
                );

                setHata(
                  "Mesajlar yüklenirken hata oluştu."
                );
              }
            );

          setLoading(false);
        } catch (error: any) {
          console.error(
            "Sohbet yüklenemedi:",
            error
          );

          setHata(
            "Sohbet yüklenirken hata oluştu:\n\n" +
              (error.message ||
                "Bilinmeyen hata")
          );

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
  }, [router, anlasmaId]);

  /*
   * MESAJ GÖNDER
   */

  async function mesajGonder() {
    if (
      !user ||
      !teklif ||
      !ilan
    ) {
      return;
    }

    const temizMesaj =
      mesaj.trim();

    if (!temizMesaj) {
      return;
    }

    try {
      setGonderiliyor(true);

      await addDoc(
        collection(
          db,
          "sohbetler",
          teklif.id,
          "mesajlar"
        ),
        {
          mesaj: temizMesaj,
          gonderenId: user.uid,
          gonderenEmail:
            user.email || "",
          tarih:
            serverTimestamp(),
        }
      );

      setMesaj("");
    } catch (error: any) {
      console.error(
        "Mesaj gönderilemedi:",
        error
      );

      alert(
        "Mesaj gönderilemedi:\n\n" +
          (error.message ||
            "Bilinmeyen hata")
      );
    } finally {
      setGonderiliyor(false);
    }
  }

  /*
   * YÜKLENİYOR
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

          <div className="text-5xl mb-4">
            💬
          </div>

          <p className="text-xl font-bold">
            Sohbet yükleniyor...
          </p>

        </div>

      </main>
    );
  }

  /*
   * HATA
   */

  if (hata) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">

        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg w-full text-center">

          <div className="text-6xl mb-5">
            ⚠️
          </div>

          <h1 className="text-2xl font-extrabold text-red-600">
            Sohbet Açılamadı
          </h1>

          <p className="text-gray-600 mt-4 whitespace-pre-line">
            {hata}
          </p>

          <button
            onClick={() =>
              router.push(
                "/anlasmalarim"
              )
            }
            className="mt-7 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            ← Anlaşmalarıma Dön
          </button>

        </div>

      </main>
    );
  }

  /*
   * SOHBET SAYFASI
   */

  return (
    <main className="min-h-screen bg-gray-100 py-8 px-4">

      <div className="max-w-4xl mx-auto">

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* ÜST BAR */}

          <div className="bg-blue-600 text-white p-6">

            <div className="flex items-center justify-between gap-4">

              <div>

                <h1 className="text-2xl md:text-3xl font-extrabold">
                  💬 Taşıma Sohbeti
                </h1>

                <p className="mt-2 text-blue-100">
                  {ilan?.nereden} →{" "}
                  {ilan?.nereye}
                </p>

              </div>

              <button
                onClick={() =>
                  router.push(
                    "/anlasmalarim"
                  )
                }
                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold"
              >
                ← Geri
              </button>

            </div>

          </div>

          {/* ANLAŞMA BİLGİSİ */}

          <div className="p-6 border-b">

            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                <div>

                  <p className="text-green-700 font-extrabold text-lg">
                    🤝 Taşıma Anlaşması
                  </p>

                  <p className="text-gray-600 mt-2">
                    📍{" "}
                    {ilan?.nereden} →{" "}
                    {ilan?.nereye}
                  </p>

                  <p className="text-gray-600 mt-1">
                    📦{" "}
                    {ilan?.yukTuru}
                  </p>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-sm text-gray-500">
                    Anlaşılan Fiyat
                  </p>

                  <p className="text-2xl font-extrabold text-green-600">

                    ₺
                    {Number(
                      teklif?.teklifFiyati ||
                        teklif?.fiyat ||
                        ilan?.kabulEdilenFiyat ||
                        0
                    ).toLocaleString(
                      "tr-TR"
                    )}

                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* MESAJLAR */}

          <div className="p-6">

            <div className="h-[500px] overflow-y-auto bg-gray-50 rounded-2xl p-5 space-y-4">

              {mesajlar.length === 0 ? (

                <div className="h-full flex items-center justify-center text-center">

                  <div>

                    <div className="text-6xl mb-4">
                      💬
                    </div>

                    <p className="text-xl font-extrabold">
                      Henüz mesaj yok
                    </p>

                    <p className="text-gray-500 mt-2">
                      Taşıma hakkında
                      konuşmaya başlayın.
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
                          className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                            benimMesajim
                              ? "bg-blue-600 text-white"
                              : "bg-white border text-gray-800"
                          }`}
                        >

                          <p className="break-words">
                            {item.mesaj}
                          </p>

                          <p
                            className={`text-xs mt-2 ${
                              benimMesajim
                                ? "text-blue-100"
                                : "text-gray-400"
                            }`}
                          >
                            {item.gonderenEmail ||
                              "Kullanıcı"}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

            {/* MESAJ GÖNDER */}

            <div className="flex gap-3 mt-5">

              <input
                type="text"
                value={mesaj}
                onChange={(e) =>
                  setMesaj(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    mesajGonder();
                  }
                }}
                placeholder="Mesajını yaz..."
                className="flex-1 border rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={
                  mesajGonder
                }
                disabled={
                  gonderiliyor
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-7 rounded-2xl font-extrabold"
              >
                {gonderiliyor
                  ? "..."
                  : "📤 Gönder"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}