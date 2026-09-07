"use client";

import { useEffect, useState } from "react";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import {
  auth,
  db,
} from "../firebase";

export default function ProfilPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [
    kaydediliyor,
    setKaydediliyor,
  ] = useState(false);

  const [
    dogrulamaKontrolEdiliyor,
    setDogrulamaKontrolEdiliyor,
  ] = useState(false);

  const [
    mailGonderiliyor,
    setMailGonderiliyor,
  ] = useState(false);

  const [hata, setHata] =
    useState("");

  const [basari, setBasari] =
    useState("");

  const [
    adSoyad,
    setAdSoyad,
  ] = useState("");

  const [
    telefon,
    setTelefon,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  // ==========================================
  // E-POSTA DOĞRULAMA DURUMU
  // ==========================================

  const [
    verified,
    setVerified,
  ] = useState(false);

  const [
    ortalamaPuan,
    setOrtalamaPuan,
  ] = useState(0);

  const [
    degerlendirmeSayisi,
    setDegerlendirmeSayisi,
  ] = useState(0);

  const [
    yorumlar,
    setYorumlar,
  ] = useState<any[]>([]);

  // ==========================================
  // PROFİLİ YÜKLE
  // ==========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            router.push(
              "/login"
            );

            return;
          }

          setLoading(true);
          setHata("");

          try {
            // ======================================
            // FIREBASE AUTH BİLGİSİNİ YENİLE
            // ======================================

            await reload(user);

            const guncelUser =
              auth.currentUser;

            if (!guncelUser) {
              router.push(
                "/login"
              );

              return;
            }

            setEmail(
              guncelUser.email ||
              ""
            );

            setVerified(
              guncelUser.emailVerified ===
                true
            );

            // ======================================
            // PROFİL BİLGİLERİ
            // ======================================

            const userRef =
              doc(
                db,
                "users",
                guncelUser.uid
              );

            const userSnap =
              await getDoc(
                userRef
              );

            if (
              userSnap.exists()
            ) {
              const data =
                userSnap.data();

              if (
                typeof data.name ===
                "string"
              ) {
                setAdSoyad(
                  data.name
                );
              }

              if (
                typeof data.phone ===
                "string"
              ) {
                setTelefon(
                  data.phone
                );
              }
            }

            // ======================================
            // BANA GELEN DEĞERLENDİRMELER
            // ======================================

            const degerlendirmeQuery =
              query(
                collection(
                  db,
                  "degerlendirmeler"
                ),
                where(
                  "degerlendirilenId",
                  "==",
                  guncelUser.uid
                )
              );

            const degerlendirmeSnap =
              await getDocs(
                degerlendirmeQuery
              );

            const liste =
              degerlendirmeSnap.docs.map(
                (item) => ({
                  id:
                    item.id,

                  ...item.data(),
                })
              );

            // En yeni değerlendirmeler üstte.
            liste.sort(
              (
                a: any,
                b: any
              ) => {
                const aTarih =
                  a.olusturulmaTarihi
                    ?.seconds ||
                  0;

                const bTarih =
                  b.olusturulmaTarihi
                    ?.seconds ||
                  0;

                return (
                  bTarih -
                  aTarih
                );
              }
            );

            setYorumlar(
              liste.slice(
                0,
                3
              )
            );

            setDegerlendirmeSayisi(
              liste.length
            );

            // ======================================
            // ORTALAMA PUAN
            // ======================================

            if (
              liste.length >
              0
            ) {
              const toplam =
                liste.reduce(
                  (
                    toplamPuan:
                      number,
                    item: any
                  ) =>
                    toplamPuan +
                    Number(
                      item.puan ||
                        0
                    ),
                  0
                );

              const ortalama =
                toplam /
                liste.length;

              setOrtalamaPuan(
                ortalama
              );
            } else {
              setOrtalamaPuan(
                0
              );
            }

          } catch (error) {
            console.error(
              "Profil yükleme hatası:",
              error
            );

            setHata(
              "Profil bilgileri alınırken bir hata oluştu."
            );

          } finally {
            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribe();
    };
  }, [router]);

  // ==========================================
  // DOĞRULAMA MAİLİNİ TEKRAR GÖNDER
  // ==========================================

  async function dogrulamaMailiGonder() {
    const user =
      auth.currentUser;

    if (!user) {
      setHata(
        "Önce giriş yapmalısın."
      );

      return;
    }

    setHata("");
    setBasari("");

    try {
      setMailGonderiliyor(
        true
      );

      // Önce güncel kullanıcı durumunu al.
      await reload(user);

      const guncelUser =
        auth.currentUser;

      if (!guncelUser) {
        setHata(
          "Kullanıcı bilgisi alınamadı."
        );

        return;
      }

      // Zaten doğrulanmışsa tekrar mail gönderme.
      if (
        guncelUser.emailVerified
      ) {
        setVerified(true);

        setBasari(
          "E-posta adresin zaten doğrulanmış. ✅"
        );

        return;
      }

      await sendEmailVerification(
        guncelUser
      );

      setBasari(
        "Doğrulama e-postası gönderildi. 📧 Gelen kutunu ve spam klasörünü kontrol et."
      );

    } catch (
      error: any
    ) {
      console.error(
        "Doğrulama maili gönderme hatası:",
        error
      );

      const kod =
        String(
          error?.code ||
          ""
        );

      if (
        kod ===
        "auth/too-many-requests"
      ) {
        setHata(
          "Çok fazla doğrulama e-postası istendi. Biraz bekleyip tekrar dene."
        );

      } else if (
        kod ===
        "auth/network-request-failed"
      ) {
        setHata(
          "İnternet bağlantısını kontrol et."
        );

      } else if (
        kod ===
        "auth/user-token-expired"
      ) {
        setHata(
          "Oturum süren dolmuş. Çıkış yapıp tekrar giriş yap."
        );

      } else {
        setHata(
          `Doğrulama e-postası gönderilirken bir hata oluştu${
            kod
              ? `: ${kod}`
              : "."
          }`
        );
      }

    } finally {
      setMailGonderiliyor(
        false
      );
    }
  }

  // ==========================================
  // E-POSTA DOĞRULAMASINI KONTROL ET
  // ==========================================

  async function dogrulamayiKontrolEt() {
    const user =
      auth.currentUser;

    if (!user) {
      setHata(
        "Önce giriş yapmalısın."
      );

      return;
    }

    setHata("");
    setBasari("");

    try {
      setDogrulamaKontrolEdiliyor(
        true
      );

      await reload(user);

      const guncelUser =
        auth.currentUser;

      if (!guncelUser) {
        setHata(
          "Kullanıcı bilgisi alınamadı."
        );

        return;
      }

      const dogrulandi =
        guncelUser.emailVerified ===
        true;

      setVerified(
        dogrulandi
      );

      if (
        dogrulandi
      ) {
        setBasari(
          "E-posta adresin doğrulandı. ✅ Hesabın artık doğrulanmış görünüyor."
        );

      } else {
        setHata(
          "E-posta adresin henüz doğrulanmamış görünüyor. Gelen kutundaki doğrulama bağlantısına tıklayıp tekrar dene."
        );
      }

    } catch (error) {
      console.error(
        "Doğrulama kontrol hatası:",
        error
      );

      setHata(
        "E-posta doğrulama durumu kontrol edilirken bir hata oluştu."
      );

    } finally {
      setDogrulamaKontrolEdiliyor(
        false
      );
    }
  }

  // ==========================================
  // PROFİLİ KAYDET
  // ==========================================

  async function profiliKaydet() {
    const user =
      auth.currentUser;

    if (!user) {
      setHata(
        "Önce giriş yapmalısın."
      );

      return;
    }

    setHata("");
    setBasari("");

    const temizAd =
      adSoyad.trim();

    const temizTelefon =
      telefon.trim();

    if (
      temizAd ===
      ""
    ) {
      setHata(
        "Lütfen ad soyad bilgisini gir."
      );

      return;
    }

    try {
      setKaydediliyor(
        true
      );

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
            temizAd,

          phone:
            temizTelefon,

          email:
            user.email ||
            "",
        },
        {
          merge: true,
        }
      );

      setAdSoyad(
        temizAd
      );

      setTelefon(
        temizTelefon
      );

      setBasari(
        "Profil bilgilerin başarıyla kaydedildi. ✅"
      );

    } catch (
      error: any
    ) {
      console.error(
        "Profil kaydetme hatası:",
        error
      );

      const kod =
        error?.code ||
        "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase profil bilgilerini güncellemeye izin vermedi."
        );

      } else if (
        kod ===
        "unavailable"
      ) {
        setHata(
          "Firebase bağlantısına şu anda ulaşılamıyor. Tekrar dene."
        );

      } else {
        setHata(
          `Profil kaydedilirken bir hata oluştu${
            kod
              ? `: ${kod}`
              : "."
          }`
        );
      }

    } finally {
      setKaydediliyor(
        false
      );
    }
  }

  // ==========================================
  // PUAN YILDIZLARI
  // ==========================================

  function puanYildizlari(
    puan: number
  ) {
    const tamPuan =
      Math.round(
        Number(
          puan ||
          0
        )
      );

    return (
      <div className="flex flex-wrap gap-1">

        {[1, 2, 3, 4, 5].map(
          (yildiz) => (
            <span
              key={yildiz}
              className={`text-2xl ${
                yildiz <=
                tamPuan
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
  // TELEFON GÖSTERİMİ
  // ==========================================

  function telefonGoster() {
    if (
      telefon.trim() ===
      ""
    ) {
      return "Telefon eklenmedi";
    }

    return telefon;
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
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">

      <div className="max-w-4xl mx-auto">

        {/* ======================================
            BAŞLIK
        ====================================== */}

        <div className="text-center mb-8">

          <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-5xl shadow-sm">
            👤
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-5">
            Profilim
          </h1>

          <p className="text-gray-500 mt-2">
            Hesap bilgilerini ve değerlendirmelerini buradan yönetebilirsin.
          </p>

        </div>

        {/* ======================================
            PROFİL ÖZETİ
        ====================================== */}

        <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-3xl shadow-xl p-6 sm:p-8 text-white mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <div className="inline-flex items-center bg-white/15 border border-white/20 px-4 py-2 rounded-full font-bold text-sm">
                  👤 YÜKLİN Kullanıcısı
                </div>

                {verified && (

                  <div className="inline-flex items-center bg-green-500 text-white border border-green-300 px-4 py-2 rounded-full font-extrabold text-sm shadow-sm">
                    ✓ Doğrulanmış Kullanıcı
                  </div>

                )}

              </div>

              <h2 className="text-2xl sm:text-3xl font-black mt-4">

                {adSoyad.trim() !== ""
                  ? adSoyad
                  : "Ad Soyad Eklenmedi"}

                {verified && (

                  <span
                    className="ml-2 text-green-300"
                    title="E-posta adresi doğrulanmış kullanıcı"
                  >
                    ✓
                  </span>

                )}

              </h2>

              <p className="text-blue-100 mt-2">
                📧 {email}
              </p>

              <p className="text-blue-100 mt-1">
                📞 {telefonGoster()}
              </p>

              {verified ? (

                <div className="mt-4 bg-green-500/20 border border-green-300/30 rounded-2xl px-4 py-3 max-w-md">

                  <p className="font-extrabold text-green-100">
                    ✅ E-posta Doğrulandı
                  </p>

                  <p className="text-sm text-green-100/90 mt-1">
                    E-posta adresin Firebase üzerinden doğrulanmıştır.
                  </p>

                </div>

              ) : (

                <div className="mt-4 bg-white/10 border border-white/15 rounded-2xl px-4 py-3 max-w-md">

                  <p className="font-bold text-blue-100">
                    🛡️ E-posta Doğrulaması Bekleniyor
                  </p>

                  <p className="text-sm text-blue-100/80 mt-1">
                    E-posta adresine gönderilen doğrulama bağlantısına tıkla.
                  </p>

                </div>

              )}

            </div>

            {/* PUAN */}

            <div className="bg-white text-gray-900 rounded-3xl p-5 min-w-[190px]">

              <p className="text-sm text-gray-500 font-semibold">
                ⭐ Değerlendirme
              </p>

              {degerlendirmeSayisi >
              0 ? (
                <>

                  <div className="flex items-end gap-2 mt-2">

                    <p className="text-4xl font-black text-yellow-500">
                      {ortalamaPuan.toFixed(
                        1
                      )}
                    </p>

                    <p className="text-gray-400 font-bold mb-1">
                      / 5
                    </p>

                  </div>

                  <div className="mt-2">

                    {puanYildizlari(
                      ortalamaPuan
                    )}

                  </div>

                  <p className="text-sm text-gray-500 mt-3">
                    {degerlendirmeSayisi} değerlendirme
                  </p>

                </>
              ) : (

                <div className="mt-3">

                  <p className="font-extrabold text-gray-500">
                    Henüz puan yok
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    İlk taşımandan sonra burada görünecek.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* ======================================
            PROFİL BİLGİLERİ
        ====================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8">

          <div className="mb-7">

            <p className="text-blue-600 font-extrabold text-sm">
              HESAP BİLGİLERİ
            </p>

            <h2 className="text-2xl font-black mt-1">
              Profil Bilgilerin
            </h2>

            <p className="text-gray-500 mt-2">
              Diğer kullanıcıların seni tanıyabilmesi için bilgilerini güncel tut.
            </p>

          </div>

          {/* HATA */}

          {hata !== "" && (

            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 font-semibold">
              ⚠️ {hata}
            </div>

          )}

          {/* BAŞARI */}

          {basari !== "" && (

            <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6 font-semibold">
              {basari}
            </div>

          )}

          {/* ======================================
              DOĞRULAMA DURUMU
          ====================================== */}

          <div
            className={`rounded-2xl p-5 mb-6 border ${
              verified
                ? "bg-green-50 border-green-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >

            <div className="flex flex-col gap-5">

              <div className="flex items-start gap-4">

                <div className="text-3xl">
                  {verified
                    ? "✅"
                    : "📧"}
                </div>

                <div>

                  <p
                    className={`font-extrabold ${
                      verified
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {verified
                      ? "Doğrulanmış Kullanıcı"
                      : "Doğrulama Bekleniyor"}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">

                    {verified
                      ? "E-posta adresin doğrulandı."
                      : "E-posta adresine gönderilen doğrulama bağlantısına tıkla."}

                  </p>

                </div>

              </div>

              {!verified && (

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* MAİLİ TEKRAR GÖNDER */}

                  <button
                    type="button"
                    onClick={
                      dogrulamaMailiGonder
                    }
                    disabled={
                      mailGonderiliyor ||
                      dogrulamaKontrolEdiliyor
                    }
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-extrabold"
                  >
                    {mailGonderiliyor
                      ? "⏳ Gönderiliyor..."
                      : "📧 Doğrulama Mailini Tekrar Gönder"}
                  </button>

                  {/* KONTROL */}

                  <button
                    type="button"
                    onClick={
                      dogrulamayiKontrolEt
                    }
                    disabled={
                      dogrulamaKontrolEdiliyor ||
                      mailGonderiliyor
                    }
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-extrabold"
                  >
                    {dogrulamaKontrolEdiliyor
                      ? "⏳ Kontrol ediliyor..."
                      : "🔄 Doğrulamayı Kontrol Et"}
                  </button>

                </div>

              )}

            </div>

          </div>

          {/* AD SOYAD */}

          <div className="mb-6">

            <label className="block font-extrabold mb-2">
              👤 Ad Soyad
            </label>

            <input
              type="text"
              value={
                adSoyad
              }
              onChange={(
                event
              ) => {
                setAdSoyad(
                  event.currentTarget
                    .value
                );

                setBasari("");
              }}
              placeholder="Örn: Ahmet Yılmaz"
              maxLength={80}
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* TELEFON */}

          <div className="mb-6">

            <label className="block font-extrabold mb-2">
              📞 Telefon
            </label>

            <input
              type="tel"
              value={
                telefon
              }
              onChange={(
                event
              ) => {
                setTelefon(
                  event.currentTarget
                    .value
                );

                setBasari("");
              }}
              placeholder="Örn: 0555 555 55 55"
              maxLength={30}
              className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <p className="text-sm text-gray-400 mt-2">
              Taşıma sürecinde iletişim için kullanılabilir.
            </p>

          </div>

          {/* E-POSTA */}

          <div className="mb-7">

            <label className="block font-extrabold mb-2">
              📧 E-posta
            </label>

            <input
              type="email"
              value={
                email
              }
              readOnly
              className="w-full border border-gray-200 rounded-xl p-4 bg-gray-100 text-gray-500 cursor-not-allowed"
            />

            <p className="text-sm text-gray-400 mt-2">
              E-posta adresi giriş yaptığın hesaba bağlıdır ve buradan değiştirilemez.
            </p>

          </div>

          {/* PROFİLİ KAYDET */}

          <button
            type="button"
            onClick={
              profiliKaydet
            }
            disabled={
              kaydediliyor
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg transition"
          >
            {kaydediliyor
              ? "⏳ Kaydediliyor..."
              : "💾 Profilimi Kaydet"}
          </button>

        </div>

        {/* ======================================
            SON DEĞERLENDİRMELER
        ====================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 mt-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

            <div>

              <p className="text-yellow-600 font-extrabold text-sm">
                DEĞERLENDİRMELER
              </p>

              <h2 className="text-2xl font-black mt-1">
                ⭐ Son Değerlendirmeler
              </h2>

              <p className="text-gray-500 mt-1">
                Tamamlanan taşımalardan sonra sana verilen puan ve yorumlar.
              </p>

            </div>

            <div className="self-start bg-yellow-100 text-yellow-700 px-5 py-2 rounded-full font-extrabold">
              {degerlendirmeSayisi} değerlendirme
            </div>

          </div>

          {yorumlar.length ===
          0 ? (

            <div className="bg-gray-50 rounded-3xl p-8 text-center">

              <div className="text-5xl mb-3">
                ⭐
              </div>

              <p className="font-extrabold text-lg">
                Henüz değerlendirme yok
              </p>

              <p className="text-gray-500 mt-2 max-w-lg mx-auto">
                Tamamlanan bir taşımanın ardından karşı taraf sana puan veya yorum verdiğinde burada görünecek.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {yorumlar.map(
                (
                  yorum: any
                ) => (

                  <div
                    key={
                      yorum.id
                    }
                    className="border border-gray-200 rounded-2xl p-5"
                  >

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                      <div>

                        {puanYildizlari(
                          Number(
                            yorum.puan ||
                              0
                          )
                        )}

                        <p className="font-extrabold text-yellow-600 mt-2">
                          {Number(
                            yorum.puan ||
                              0
                          )}
                          /5
                        </p>

                      </div>

                      <span className="self-start bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                        👤 YÜKLİN Kullanıcısı
                      </span>

                    </div>

                    {yorum.yorum ? (

                      <div className="bg-gray-50 rounded-xl p-4 mt-4">

                        <p className="text-gray-700 whitespace-pre-wrap">
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

                      <div className="mt-4 pt-4 border-t border-gray-100">

                        <p className="text-sm text-gray-500">
                          📍{" "}
                          {yorum.nereden ||
                            "-"}{" "}
                          →{" "}
                          {yorum.nereye ||
                            "-"}
                        </p>

                      </div>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

        {/* ======================================
            HIZLI İŞLEMLER
        ====================================== */}

        <div className="mt-6">

          <h2 className="text-xl font-black mb-4">
            🚀 Hızlı İşlemler
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/benim-ilanlarim"
                );
              }}
              className="bg-white hover:bg-blue-50 border border-gray-100 rounded-2xl shadow-md p-5 text-left transition"
            >

              <div className="text-3xl mb-3">
                📦
              </div>

              <div className="font-extrabold text-lg">
                İlanlarım
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Yayınladığın yük ilanlarını yönet.
              </div>

            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/tekliflerim"
                );
              }}
              className="bg-white hover:bg-green-50 border border-gray-100 rounded-2xl shadow-md p-5 text-left transition"
            >

              <div className="text-3xl mb-3">
                💰
              </div>

              <div className="font-extrabold text-lg">
                Tekliflerim
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Gönderdiğin teklifleri takip et.
              </div>

            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/gelen-teklifler"
                );
              }}
              className="bg-white hover:bg-purple-50 border border-gray-100 rounded-2xl shadow-md p-5 text-left transition"
            >

              <div className="text-3xl mb-3">
                📥
              </div>

              <div className="font-extrabold text-lg">
                Gelen Teklifler
              </div>

              <div className="text-sm text-gray-500 mt-1">
                İlanlarına gönderilen teklifleri yönet.
              </div>

            </button>

            <button
              type="button"
              onClick={() => {
                router.push(
                  "/anlasmalarim"
                );
              }}
              className="bg-white hover:bg-orange-50 border border-gray-100 rounded-2xl shadow-md p-5 text-left transition"
            >

              <div className="text-3xl mb-3">
                🤝
              </div>

              <div className="font-extrabold text-lg">
                Anlaşmalarım
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Aktif ve tamamlanan taşımalarını gör.
              </div>

            </button>

          </div>

        </div>

        {/* ANA SAYFA */}

        <button
          type="button"
          onClick={() => {
            router.push("/");
          }}
          className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl p-4 font-extrabold transition"
        >
          🏠 Ana Sayfaya Dön
        </button>

      </div>

    </main>
  );
}