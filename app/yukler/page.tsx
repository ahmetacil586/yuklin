"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";

export default function YuklerPage() {
  const [yukler, setYukler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const yuklerQuery = query(
      collection(db, "yukler"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      yuklerQuery,
      (snapshot) => {
        const liste = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setYukler(liste);
        setLoading(false);
      },
      (error) => {
        console.error("Yükler alınamadı:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const paraSembolu = (paraBirimi: string) => {
    if (paraBirimi === "USD") return "$";
    if (paraBirimi === "EUR") return "€";
    return "₺";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <p className="text-xl font-bold">
            Yük ilanları yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">

      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-10">

          <h1 className="text-4xl font-extrabold text-blue-700">
            📦 Yük İlanları
          </h1>

          <p className="text-gray-500 mt-3">
            Yayındaki yük ilanlarını incele ve uygun yükleri bul.
          </p>

        </div>

        {yukler.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-xl p-12 text-center">

            <div className="text-6xl">
              📦
            </div>

            <h2 className="text-2xl font-extrabold mt-5">
              Henüz ilan yok
            </h2>

            <p className="text-gray-500 mt-3">
              Şu anda yayınlanmış bir yük ilanı bulunmuyor.
            </p>

            <Link
              href="/yuk-ver"
              className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              📦 Yük İlanı Ver
            </Link>

          </div>

        ) : (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {yukler.map((ilan) => (

              <div
                key={ilan.id}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition"
              >

                {/* GÜZERGAH */}

                <div className="flex items-center justify-between gap-3">

                  <div className="font-extrabold text-lg text-blue-700">
                    📍 {ilan.nereden || "-"}
                  </div>

                  <div className="text-gray-400 font-bold">
                    →
                  </div>

                  <div className="font-extrabold text-lg text-blue-700">
                    {ilan.nereye || "-"}
                  </div>

                </div>

                {/* DURUM */}

                <div className="mt-5">

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      ilan.durum === "Anlaşıldı"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {ilan.durum === "Anlaşıldı"
                      ? "✅ Anlaşıldı"
                      : ilan.durum || "Açık"}
                  </span>

                </div>

                {/* BİLGİLER */}

                <div className="mt-5 space-y-3">

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      📦 Yük Türü
                    </p>

                    <p className="font-bold mt-1">
                      {ilan.yukTuru || "-"}
                    </p>

                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      ⚖️ Ağırlık
                    </p>

                    <p className="font-bold mt-1">
                      {ilan.agirlik || "-"}
                    </p>

                  </div>

                  {/* FİYAT */}

                  <div className="bg-green-50 rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      💰 Yük Sahibinin Teklif Ettiği Ücret
                    </p>

                    <p className="text-2xl font-extrabold text-green-600 mt-1">

                      {paraSembolu(ilan.paraBirimi)}

                      {Number(
                        ilan.fiyat || 0
                      ).toLocaleString("tr-TR")}

                    </p>

                  </div>

                </div>

                {/* AÇIKLAMA */}

                {ilan.aciklama && (

                  <div className="mt-4">

                    <p className="text-sm text-gray-500">
                      📝 Açıklama
                    </p>

                    <p className="text-gray-600 mt-1 line-clamp-2">
                      {ilan.aciklama}
                    </p>

                  </div>

                )}

                {/* BUTON */}

                <Link
                  href={`/ilan/${ilan.id}`}
                  className="block text-center mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold"
                >
                  🔎 Detayları Gör
                </Link>

              </div>

            ))}

          </div>

        )}

      </div>

    </main>
  );
}