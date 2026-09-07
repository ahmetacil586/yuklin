"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import {
  auth,
  db,
} from "../firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("nakliyeci");

  const [loading, setLoading] =
    useState(false);

  const [mesaj, setMesaj] =
    useState("");

  // ==========================================
  // KAYIT OL
  // ==========================================

  async function register() {
    setMesaj("");

    const temizName =
      name.trim();

    const temizEmail =
      email
        .trim()
        .toLowerCase();

    const temizPhone =
      phone.trim();

    // ========================================
    // KONTROLLER
    // ========================================

    if (
      temizName === "" ||
      temizEmail === "" ||
      temizPhone === "" ||
      password === ""
    ) {
      setMesaj(
        "❌ Lütfen tüm alanları doldur."
      );

      return;
    }

    if (password.length < 6) {
      setMesaj(
        "❌ Şifre en az 6 karakter olmalı."
      );

      return;
    }

    if (
      role !== "nakliyeci" &&
      role !== "yuk_sahibi"
    ) {
      setMesaj(
        "❌ Lütfen hesap türünü seç."
      );

      return;
    }

    try {
      setLoading(true);

      // ========================================
      // FIREBASE AUTH HESABI OLUŞTUR
      // ========================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          temizEmail,
          password
        );

      const user =
        userCredential.user;

      // ========================================
      // FIRESTORE KULLANICI BELGESİ
      // ========================================

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {
          uid:
            user.uid,

          name:
            temizName,

          email:
            temizEmail,

          phone:
            temizPhone,

          role:
            role,

          createdAt:
            new Date(),
        }
      );

      // ========================================
      // DOĞRULAMA E-POSTASI GÖNDER
      // ========================================

      await sendEmailVerification(
        user
      );

      // ========================================
      // KAYIT SONRASI OTURUMU KAPAT
      // ========================================

      await signOut(
        auth
      );

      // ========================================
      // BAŞARILI
      // ========================================

      setMesaj(
        "✅ Hesabın oluşturuldu! E-posta adresine doğrulama bağlantısı gönderdik. Gelen kutunu kontrol et. 📧"
      );

      setTimeout(
        () => {
          router.push(
            "/login"
          );
        },
        3000
      );

    } catch (error: any) {
      console.error(
        "Kayıt hatası:",
        error
      );

      const hataKodu =
        String(
          error?.code || ""
        );

      if (
        hataKodu ===
        "auth/email-already-in-use"
      ) {
        setMesaj(
          "❌ Bu e-posta adresi zaten kayıtlı."
        );

      } else if (
        hataKodu ===
        "auth/invalid-email"
      ) {
        setMesaj(
          "❌ Geçerli bir e-posta adresi gir."
        );

      } else if (
        hataKodu ===
        "auth/weak-password"
      ) {
        setMesaj(
          "❌ Şifren çok zayıf. En az 6 karakter kullan."
        );

      } else if (
        hataKodu ===
        "auth/network-request-failed"
      ) {
        setMesaj(
          "❌ İnternet bağlantısını kontrol et."
        );

      } else if (
        hataKodu ===
        "auth/too-many-requests"
      ) {
        setMesaj(
          "❌ Çok fazla işlem yapıldı. Biraz bekleyip tekrar dene."
        );

      } else {
        setMesaj(
          `❌ Kayıt sırasında bir hata oluştu${
            hataKodu
              ? `: ${hataKodu}`
              : "."
          }`
        );
      }

    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 py-12">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-6 sm:p-8">

        {/* LOGO */}

        <h1 className="text-4xl font-extrabold text-blue-700 text-center">
          🚛 YÜKLİN
        </h1>

        <p className="text-center text-gray-500 mt-3">
          Hesabını oluştur
        </p>

        {/* DOĞRULAMA BİLGİSİ */}

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-2xl p-4">

          <div className="flex gap-3">

            <div className="text-2xl">
              📧
            </div>

            <div>

              <p className="font-extrabold text-blue-700">
                E-posta Doğrulaması
              </p>

              <p className="text-sm text-blue-600 mt-1">
                Kayıt tamamlandığında e-posta adresine doğrulama bağlantısı göndereceğiz.
              </p>

            </div>

          </div>

        </div>

        <div className="space-y-4 mt-6">

          {/* AD SOYAD */}

          <div>

            <label className="block font-bold mb-2">
              👤 Ad Soyad
            </label>

            <input
              type="text"
              placeholder="Ad Soyad"
              value={name}
              onChange={(event) => {
                setName(
                  event.currentTarget.value
                );

                setMesaj("");
              }}
              maxLength={80}
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* E-POSTA */}

          <div>

            <label className="block font-bold mb-2">
              📧 E-posta
            </label>

            <input
              type="email"
              placeholder="ornek@gmail.com"
              value={email}
              onChange={(event) => {
                setEmail(
                  event.currentTarget.value
                );

                setMesaj("");
              }}
              autoComplete="email"
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* TELEFON */}

          <div>

            <label className="block font-bold mb-2">
              📞 Telefon
            </label>

            <input
              type="tel"
              placeholder="0555 555 55 55"
              value={phone}
              onChange={(event) => {
                setPhone(
                  event.currentTarget.value
                );

                setMesaj("");
              }}
              maxLength={30}
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* HESAP TÜRÜ */}

          <div>

            <p className="font-bold text-gray-700 mb-2">
              YÜKLİN'i ağırlıklı olarak ne için kullanacaksın?
            </p>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => {
                  setRole(
                    "yuk_sahibi"
                  );

                  setMesaj("");
                }}
                className={`p-4 rounded-xl border-2 font-bold transition ${
                  role ===
                  "yuk_sahibi"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >

                <div className="text-3xl">
                  📦
                </div>

                <div className="mt-2">
                  Yük Sahibiyim
                </div>

              </button>

              <button
                type="button"
                onClick={() => {
                  setRole(
                    "nakliyeci"
                  );

                  setMesaj("");
                }}
                className={`p-4 rounded-xl border-2 font-bold transition ${
                  role ===
                  "nakliyeci"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >

                <div className="text-3xl">
                  🚛
                </div>

                <div className="mt-2">
                  Nakliyeciyim
                </div>

              </button>

            </div>

            <p className="text-xs text-gray-400 mt-2">
              Hesap türün kullanımını kısıtlamaz. Her iki özelliği de kullanabilirsin.
            </p>

          </div>

          {/* ŞİFRE */}

          <div>

            <label className="block font-bold mb-2">
              🔒 Şifre
            </label>

            <input
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.currentTarget.value
                );

                setMesaj("");
              }}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* MESAJ */}

          {mesaj !== "" && (

            <div
              className={`rounded-xl p-4 text-center font-bold ${
                mesaj.startsWith(
                  "✅"
                )
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {mesaj}
            </div>

          )}

          {/* HESAP OLUŞTUR */}

          <button
            type="button"
            onClick={
              register
            }
            disabled={
              loading
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg transition"
          >
            {loading
              ? "⏳ Hesap oluşturuluyor..."
              : "🚀 Hesap Oluştur"}
          </button>

          {/* GİRİŞ */}

          <button
            type="button"
            onClick={() => {
              router.push(
                "/login"
              );
            }}
            disabled={
              loading
            }
            className="w-full text-blue-600 hover:text-blue-700 font-bold py-2"
          >
            Zaten hesabım var → Giriş Yap
          </button>

          {/* ANA SAYFA */}

          <button
            type="button"
            onClick={() => {
              router.push(
                "/"
              );
            }}
            disabled={
              loading
            }
            className="w-full text-gray-500 hover:text-gray-700 font-bold py-2"
          >
            🏠 Ana Sayfaya Dön
          </button>

        </div>

      </div>

    </main>
  );
}