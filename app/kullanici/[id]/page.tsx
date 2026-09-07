"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../firebase";

export default function KullaniciProfilPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [hata, setHata] = useState("");

  const [adSoyad, setAdSoyad] = useState("");
  const [role, setRole] = useState("");

  const [ortalamaPuan, setOrtalamaPuan] = useState(0);
  const [degerlendirmeSayisi, setDegerlendirmeSayisi] =
    useState(0);

  const [yorumlar, setYorumlar] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        const kullaniciId = String(params?.id || "");

        if (!kullaniciId) {
          setHata("Kullanıcı bulunamadı.");
          setLoading(false);
          return;
        }

        try {
          // ==========================================
          // KULLANICI BİLGİLERİ
          // ==========================================

          const userRef = doc(
            db,
            "users",
            kullaniciId
          );

          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            setHata("Kullanıcı bulunamadı.");
            setLoading(false);
            return;
          }

          const data = userSnap.data();

          if (typeof data.name === "string") {
            setAdSoyad(data.name);
          }

          if (typeof data.role === "string") {
            setRole(data.role);
          }

          // ==========================================
          // KULLANICIYA GELEN DEĞERLENDİRMELER
          // ==========================================

          const degerlendirmeQuery = query(
            collection(
              db,
              "degerlendirmeler"
            ),
            where(
              "degerlendirilenId",
              "==",
              kullaniciId
            )
          );

          const degerlendirmeSnap =
            await getDocs(degerlendirmeQuery);

          const liste =
            degerlendirmeSnap.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              })
            );

          // En yeni değerlendirmeler üstte.
          liste.sort(
            (a: any, b: any) => {
              const aTarih =
                a.olusturulmaTarihi?.seconds || 0;

              const bTarih =
                b.olusturulmaTarihi?.seconds || 0;

              return bTarih - aTarih;
            }
          );

          setYorumlar(liste.slice(0, 5));

          setDegerlendirmeSayisi(
            liste.length
          );

          if (liste.length > 0) {
            const toplamPuan =
              liste.reduce(
                (
                  toplam: number,
                  item: any
                ) =>
                  toplam +
                  Number(item.puan || 0),
                0
              );

            setOrtalamaPuan(
              toplamPuan / liste.length
            );
          } else {
            setOrtalamaPuan(0);
          }
        } catch {
          setHata(
            "Kullanıcı profili yüklenirken bir hata oluştu."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [params?.id, router]);

  // ==========================================
  // ROL GÖSTER
  // ==========================================

  function rolGoster() {
    if (role === "nakliyeci") {
      return "🚛 Nakliyeci";
    }

    if (role === "yuk_sahibi") {
      return "📦 Yük Sahibi";
    }

    return "👤 Kullanıcı";
  }

  // ==========================================
  // YILDIZLAR
  // ==========================================

  function puanYildizlari(
    puan: number
  ) {
    const yuvarlanmisPuan =
      Math.round(
        Number(puan || 0)
      );

    return (
      <div className="flex flex-wrap gap-1">
        {[1, 2, 3, 4, 5].map(
          (yildiz) => (
            <span
              key={yildiz}
              className={`text-2xl ${
                yildiz <= yuvarlanmisPuan
                  ? "opacity-100"
                  : "opacity-20"
              }`}
            >
              ⭐
            </span>
          )
        )}
      </div>
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
            👤
          </div>

          <p className="text-xl font-bold">
            Profil yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // HATA
  // ==========================================

  if (hata !== "") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h1 className="text-2xl font-extrabold">
            Profil açılamadı
          </h1>

          <p className="text-red-600 mt-3">
            {hata}
          </p>

          <button
            type="button"
            onClick={() => {
              router.back();
            }}
            className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold"
          >
            ← Geri Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* GERİ DÖN */}

        <button
          type="button"
          onClick={() => {
            router.back();
          }}
          className="mb-6 bg-white hover:bg-gray-100 shadow-sm border border-gray-200 px-5 py-3 rounded-xl font-bold"
        >
          ← Geri Dön
        </button>

        {/* ==========================================
            PROFİL
        ========================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 text-center">

          <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-5xl">
            👤
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-5">
            {adSoyad || "Kullanıcı"}
          </h1>

          <div className="mt-3">
            <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full font-bold">
              {rolGoster()}
            </span>
          </div>

          {/* PUAN */}

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mt-7">
            {degerlendirmeSayisi > 0 ? (
              <>
                <div className="flex justify-center">
                  {puanYildizlari(
                    ortalamaPuan
                  )}
                </div>

                <p className="text-4xl font-extrabold text-yellow-600 mt-3">
                  {ortalamaPuan.toFixed(1)}
                  <span className="text-lg text-gray-500">
                    /5
                  </span>
                </p>

                <p className="text-gray-500 mt-2">
                  {degerlendirmeSayisi} değerlendirme
                </p>
              </>
            ) : (
              <>
                <div className="text-4xl">
                  ⭐
                </div>

                <p className="text-xl font-extrabold mt-3">
                  Henüz değerlendirme yok
                </p>

                <p className="text-gray-500 mt-2">
                  Bu kullanıcı henüz puanlanmamış.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ==========================================
            DEĞERLENDİRMELER
        ========================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 mt-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold">
                💬 Değerlendirmeler
              </h2>

              <p className="text-gray-500 mt-1">
                Tamamlanan taşımalardan gelen yorumlar.
              </p>
            </div>

            <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold">
              {degerlendirmeSayisi}
            </span>
          </div>

          {yorumlar.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-3">
                💬
              </div>

              <p className="font-extrabold text-lg">
                Henüz yorum yok
              </p>

              <p className="text-gray-500 mt-2">
                Kullanıcıya yapılan değerlendirmeler burada görünecek.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {yorumlar.map(
                (yorum: any) => (
                  <div
                    key={yorum.id}
                    className="border border-gray-200 rounded-2xl p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        {puanYildizlari(
                          Number(
                            yorum.puan || 0
                          )
                        )}

                        <p className="font-extrabold text-yellow-600 mt-2">
                          {Number(
                            yorum.puan || 0
                          )}
                          /5
                        </p>
                      </div>

                      <span className="self-start bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-sm font-bold">
                        {yorum.degerlendirenRol ===
                        "nakliyeci"
                          ? "🚛 Nakliyeci"
                          : yorum.degerlendirenRol ===
                            "yuk_sahibi"
                          ? "📦 Yük Sahibi"
                          : "👤 Kullanıcı"}
                      </span>
                    </div>

                    {yorum.yorum ? (
                      <div className="bg-gray-50 rounded-xl p-4 mt-4">
                        <p className="text-gray-700">
                          📝 {yorum.yorum}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm mt-4">
                        Yorum bırakılmadı.
                      </p>
                    )}

                    {(yorum.nereden ||
                      yorum.nereye) && (
                      <p className="text-sm text-gray-400 mt-4">
                        📍{" "}
                        {yorum.nereden || "-"}{" "}
                        →{" "}
                        {yorum.nereye || "-"}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ALT BUTON */}

        <button
          type="button"
          onClick={() => {
            router.push("/");
          }}
          className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold"
        >
          🏠 Ana Sayfa
        </button>

      </div>
    </main>
  );
}