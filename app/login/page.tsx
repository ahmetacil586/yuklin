"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState("");

  async function login() {
    setMesaj("");

    if (!email.trim() || !password) {
      setMesaj("❌ E-posta ve şifreyi gir.");
      return;
    }

    try {
      setLoading(true);

      // Oturumu tarayıcıda kalıcı tut
      await setPersistence(auth, browserLocalPersistence);

      // Firebase'e giriş yap
      const sonuc = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("✅ Giriş başarılı:", sonuc.user.email);
      console.log("✅ Kullanıcı UID:", sonuc.user.uid);

      setMesaj(
        "✅ Giriş başarılı! Ana sayfaya yönlendiriliyorsun..."
      );

      // Header'ın yeni kullanıcıyı kesin olarak görmesi için
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (error: any) {
      console.error("Giriş hatası:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setMesaj("❌ E-posta veya şifre hatalı.");

      } else if (error.code === "auth/invalid-email") {
        setMesaj("❌ Geçerli bir e-posta adresi gir.");

      } else if (error.code === "auth/too-many-requests") {
        setMesaj(
          "❌ Çok fazla başarısız giriş denemesi. Biraz sonra tekrar dene."
        );

      } else if (error.code === "auth/network-request-failed") {
        setMesaj("❌ İnternet bağlantısını kontrol et.");

      } else {
        setMesaj(
          "❌ Giriş sırasında hata oluştu: " +
            (error.message || "Bilinmeyen hata")
        );
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-12">

      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">

        <h1 className="text-4xl font-extrabold text-blue-700 text-center">
          🚛 YÜKLİN
        </h1>

        <p className="text-center text-gray-500 mt-3 mb-8">
          Hesabına giriş yap
        </p>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl p-4"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                login();
              }
            }}
            className="w-full border rounded-xl p-4"
          />

          {mesaj && (
            <div className="bg-gray-50 rounded-xl p-4 text-center font-bold">
              {mesaj}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold"
          >
            {loading
              ? "⏳ Giriş yapılıyor..."
              : "🔐 Giriş Yap"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/register")}
            className="w-full text-blue-600 font-bold py-2"
          >
            Hesabım yok → Kayıt Ol
          </button>

        </div>

      </div>

    </main>
  );
}