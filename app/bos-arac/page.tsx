"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db } from "../firebase";

type Arac = {
  id: string;
  bulunduguYer: string;
  gidecegiYer: string;
  aracTipi: string;
  kapasite: string;
  aciklama: string;
  kullaniciAdi: string;
  kullaniciTelefonu: string;
  durum: string;
  userId: string;
  createdAt?: any;
};

type Yuk = {
  id: string;
  userId: string;
  nereden: string;
  nereye: string;
  yukTuru: string;
  agirlik: string;
  fiyat: number;
  paraBirimi: string;
  durum: string;
  createdAt?: any;
};

export default function BosAracPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [
    profilYukleniyor,
    setProfilYukleniyor,
  ] = useState(true);

  const [
    bulunduguYer,
    setBulunduguYer,
  ] = useState("");

  const [
    gidecegiYer,
    setGidecegiYer,
  ] = useState("");

  const [
    aracTipi,
    setAracTipi,
  ] = useState("");

  const [
    kapasite,
    setKapasite,
  ] = useState("");

  const [
    aciklama,
    setAciklama,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    islemYapiliyor,
    setIslemYapiliyor,
  ] = useState("");

  const [
    hata,
    setHata,
  ] = useState("");

  const [
    basari,
    setBasari,
  ] = useState("");

  const [
    araclar,
    setAraclar,
  ] = useState<Arac[]>([]);

  const [
    araclarYukleniyor,
    setAraclarYukleniyor,
  ] = useState(true);

  // ==========================================
  // KENDİ AÇIK YÜKLERİM
  // ==========================================

  const [
    yuklerim,
    setYuklerim,
  ] = useState<Yuk[]>([]);

  // ==========================================
  // YÜK TEKLİFİ
  // ==========================================

  const [
    teklifVerilenAracId,
    setTeklifVerilenAracId,
  ] = useState("");

  const [
    secilenYukId,
    setSecilenYukId,
  ] = useState("");

  const [
    yukTeklifMesaji,
    setYukTeklifMesaji,
  ] = useState("");

  const [
    yukTeklifiGonderiliyor,
    setYukTeklifiGonderiliyor,
  ] = useState(false);

  // ==========================================
  // DÜZENLEME
  // ==========================================

  const [
    duzenlenenAracId,
    setDuzenlenenAracId,
  ] = useState("");

  const [
    duzenleBulunduguYer,
    setDuzenleBulunduguYer,
  ] = useState("");

  const [
    duzenleGidecegiYer,
    setDuzenleGidecegiYer,
  ] = useState("");

  const [
    duzenleAracTipi,
    setDuzenleAracTipi,
  ] = useState("");

  const [
    duzenleKapasite,
    setDuzenleKapasite,
  ] = useState("");

  const [
    duzenleAciklama,
    setDuzenleAciklama,
  ] = useState("");

  // ==========================================
  // KULLANICI
  // ==========================================

  useEffect(() => {
    let unsubscribeYukler:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (!currentUser) {
            setUser(null);
            setYuklerim([]);
            setProfilYukleniyor(false);
            return;
          }

          setUser(currentUser);

          const yukQuery =
            query(
              collection(
                db,
                "yukler"
              ),
              where(
                "userId",
                "==",
                currentUser.uid
              )
            );

          unsubscribeYukler =
            onSnapshot(
              yukQuery,
              (snapshot) => {
                const liste =
                  snapshot.docs
                    .map(
                      (item) => ({
                        id:
                          item.id,

                        ...(item.data() as Omit<
                          Yuk,
                          "id"
                        >),
                      })
                    )
                    .filter(
                      (item) =>
                        item.durum ===
                        "Açık"
                    );

                liste.sort(
                  (
                    a: any,
                    b: any
                  ) => {
                    const aTarih =
                      a.createdAt
                        ?.seconds ||
                      0;

                    const bTarih =
                      b.createdAt
                        ?.seconds ||
                      0;

                    return (
                      bTarih -
                      aTarih
                    );
                  }
                );

                setYuklerim(
                  liste
                );

                setProfilYukleniyor(
                  false
                );
              },
              () => {
                setYuklerim(
                  []
                );

                setProfilYukleniyor(
                  false
                );
              }
            );
        }
      );

    return () => {
      unsubscribeAuth();

      if (
        unsubscribeYukler
      ) {
        unsubscribeYukler();
      }
    };
  }, []);

  // ==========================================
  // AÇIK ARAÇLARI GETİR
  // ==========================================

  useEffect(() => {
    const aracQuery =
      query(
        collection(
          db,
          "araclar"
        ),
        where(
          "durum",
          "==",
          "Açık"
        )
      );

    const unsubscribe =
      onSnapshot(
        aracQuery,
        (snapshot) => {
          const liste =
            snapshot.docs.map(
              (item) => ({
                id:
                  item.id,

                ...(item.data() as Omit<
                  Arac,
                  "id"
                >),
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
                0;

              const bTarih =
                b.createdAt
                  ?.seconds ||
                0;

              return (
                bTarih -
                aTarih
              );
            }
          );

          setAraclar(
            liste
          );

          setAraclarYukleniyor(
            false
          );
        },
        () => {
          setHata(
            "Boş araçlar yüklenirken bir hata oluştu."
          );

          setAraclarYukleniyor(
            false
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, []);

  // ==========================================
  // GİRİŞ KONTROLÜ
  // ==========================================

  function girisKontrolEt() {
    if (!user) {
      setHata(
        "Bu işlem için önce giriş yapmalısın."
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // BİLDİRİM OLUŞTUR
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

          okundu:
            false,

          createdAt:
            serverTimestamp(),
        }
      );
    } catch {
      // Bildirim hatası ana işlemi bozmasın.
    }
  }

  // ==========================================
  // BOŞ ARAÇ OLUŞTUR
  // ==========================================

  async function aracOlustur() {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    const temizBulunduguYer =
      bulunduguYer.trim();

    const temizGidecegiYer =
      gidecegiYer.trim();

    const temizAracTipi =
      aracTipi.trim();

    const temizKapasite =
      kapasite.trim();

    const temizAciklama =
      aciklama.trim();

    if (
      temizBulunduguYer ===
        "" ||
      temizGidecegiYer ===
        "" ||
      temizAracTipi === "" ||
      temizKapasite === ""
    ) {
      setHata(
        "Lütfen gerekli alanları doldur."
      );

      return;
    }

    try {
      setLoading(
        true
      );

      const userDoc =
        await getDoc(
          doc(
            db,
            "users",
            user.uid
          )
        );

      const userData =
        userDoc.exists()
          ? userDoc.data()
          : {};

      await addDoc(
        collection(
          db,
          "araclar"
        ),
        {
          bulunduguYer:
            temizBulunduguYer,

          gidecegiYer:
            temizGidecegiYer,

          aracTipi:
            temizAracTipi,

          kapasite:
            temizKapasite,

          aciklama:
            temizAciklama,

          userId:
            user.uid,

          kullaniciAdi:
            userData.name ||
            userData.adSoyad ||
            "İsimsiz Kullanıcı",

          kullaniciTelefonu:
            userData.phone ||
            userData.telefon ||
            "",

          durum:
            "Açık",

          createdAt:
            serverTimestamp(),
        }
      );

      setBasari(
        "Boş araç ilanı başarıyla yayınlandı! 🚛✅"
      );

      setBulunduguYer("");
      setGidecegiYer("");
      setAracTipi("");
      setKapasite("");
      setAciklama("");
    } catch (error: any) {
      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Boş araç ilanı oluşturulurken bir hata oluştu."
        );
      }
    } finally {
      setLoading(
        false
      );
    }
  }

  // ==========================================
  // YÜK TEKLİFİ PANELİNİ AÇ
  // ==========================================

  function yukTeklifiniAc(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      arac.userId ===
      user.uid
    ) {
      setHata(
        "Kendi araç ilanına yük teklif edemezsin."
      );

      return;
    }

    if (
      yuklerim.length ===
      0
    ) {
      setHata(
        "Yük teklif etmek için önce açık bir yük ilanı oluşturmalısın."
      );

      return;
    }

    if (
      teklifVerilenAracId ===
      arac.id
    ) {
      setTeklifVerilenAracId(
        ""
      );

      setSecilenYukId(
        ""
      );

      setYukTeklifMesaji(
        ""
      );

      return;
    }

    setTeklifVerilenAracId(
      arac.id
    );

    setSecilenYukId(
      ""
    );

    setYukTeklifMesaji(
      ""
    );
  }

  // ==========================================
  // YÜK TEKLİFİNİ GÖNDER
  // ==========================================

  async function yukTeklifiGonder(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      arac.userId ===
      user.uid
    ) {
      setHata(
        "Kendi araç ilanına yük teklif edemezsin."
      );

      return;
    }

    if (
      !secilenYukId
    ) {
      setHata(
        "Lütfen teklif etmek istediğin yük ilanını seç."
      );

      return;
    }

    const secilenYuk =
      yuklerim.find(
        (item) =>
          item.id ===
          secilenYukId
      );

    if (!secilenYuk) {
      setHata(
        "Seçilen yük ilanı bulunamadı."
      );

      return;
    }

    if (
      secilenYuk.userId !==
      user.uid
    ) {
      setHata(
        "Sadece kendi yük ilanını teklif edebilirsin."
      );

      return;
    }

    if (
      secilenYuk.durum !==
      "Açık"
    ) {
      setHata(
        "Bu yük ilanı artık açık değil."
      );

      return;
    }

    const temizMesaj =
      yukTeklifMesaji.trim();

    try {
      setYukTeklifiGonderiliyor(
        true
      );

      // ======================================
      // ARACI SON KEZ KONTROL ET
      // ======================================

      const aracSnap =
        await getDoc(
          doc(
            db,
            "araclar",
            arac.id
          )
        );

      if (
        !aracSnap.exists()
      ) {
        setHata(
          "Bu araç ilanı artık mevcut değil."
        );

        return;
      }

      const guncelArac: any =
        aracSnap.data();

      if (
        guncelArac.durum !==
        "Açık"
      ) {
        setHata(
          "Bu araç ilanı artık açık değil."
        );

        return;
      }

      if (
        guncelArac.userId ===
        user.uid
      ) {
        setHata(
          "Kendi araç ilanına yük teklif edemezsin."
        );

        return;
      }

      // ======================================
      // YÜKÜ SON KEZ KONTROL ET
      // ======================================

      const yukSnap =
        await getDoc(
          doc(
            db,
            "yukler",
            secilenYuk.id
          )
        );

      if (
        !yukSnap.exists()
      ) {
        setHata(
          "Seçilen yük ilanı artık mevcut değil."
        );

        return;
      }

      const guncelYuk: any =
        yukSnap.data();

      if (
        guncelYuk.userId !==
        user.uid
      ) {
        setHata(
          "Bu yük ilanı sana ait değil."
        );

        return;
      }

      if (
        guncelYuk.durum !==
        "Açık"
      ) {
        setHata(
          "Seçtiğin yük ilanı artık açık değil."
        );

        return;
      }

      // ======================================
      // ARAÇ TEKLİFİNİ OLUŞTUR
      // ======================================

      await addDoc(
        collection(
          db,
          "aracTeklifleri"
        ),
        {
          yukId:
            secilenYuk.id,

          aracId:
            arac.id,

          yukSahibiId:
            user.uid,

          aracSahibiId:
            String(
              guncelArac.userId
            ),

          nereden:
            String(
              guncelYuk.nereden ||
              ""
            ),

          nereye:
            String(
              guncelYuk.nereye ||
              ""
            ),

          yukTuru:
            String(
              guncelYuk.yukTuru ||
              ""
            ),

          agirlik:
            String(
              guncelYuk.agirlik ||
              ""
            ),

          yukFiyati:
            Number(
              guncelYuk.fiyat ||
              0
            ),

          paraBirimi:
            String(
              guncelYuk.paraBirimi ||
              "TRY"
            ),

          aracTipi:
            String(
              guncelArac.aracTipi ||
              ""
            ),

          kapasite:
            String(
              guncelArac.kapasite ||
              ""
            ),

          aracBulunduguYer:
            String(
              guncelArac.bulunduguYer ||
              ""
            ),

          aracGidecegiYer:
            String(
              guncelArac.gidecegiYer ||
              ""
            ),

          mesaj:
            temizMesaj,

          durum:
            "Bekliyor",

          createdAt:
            serverTimestamp(),
        }
      );

      // ======================================
      // ARAÇ SAHİBİNE BİLDİRİM
      // ======================================

      await bildirimOlustur({
        kullaniciId:
          String(
            guncelArac.userId
          ),

        baslik:
          "📦 Yeni Yük Teklifi",

        mesaj:
          `${
            guncelYuk.nereden ||
            "Yük"
          } → ${
            guncelYuk.nereye ||
            ""
          } yükün aracın için teklif edildi.`,

        tip:
          "arac_yuk_teklifi",

        hedef:
          "/gelen-teklifler",
      });

      setBasari(
        "Yük teklifin araç sahibine gönderildi! 📦🚛✅"
      );

      setTeklifVerilenAracId(
        ""
      );

      setSecilenYukId(
        ""
      );

      setYukTeklifMesaji(
        ""
      );
    } catch (error: any) {
      const kod =
        error?.code ||
        "";

      if (
        kod ===
        "permission-denied"
      ) {
        setHata(
          "Firebase yük teklifine izin vermedi. İlanların hâlâ açık olduğunu kontrol et."
        );
      } else {
        setHata(
          `Yük teklifi gönderilemedi${
            kod
              ? `: ${kod}`
              : "."
          }`
        );
      }
    } finally {
      setYukTeklifiGonderiliyor(
        false
      );
    }
  }

  // ==========================================
  // DÜZENLEMEYİ BAŞLAT
  // ==========================================

  function duzenlemeyiBaslat(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (
      !user ||
      arac.userId !==
        user.uid
    ) {
      setHata(
        "Bu araç ilanını düzenleme yetkin yok."
      );

      return;
    }

    setDuzenlenenAracId(
      arac.id
    );

    setDuzenleBulunduguYer(
      arac.bulunduguYer ||
      ""
    );

    setDuzenleGidecegiYer(
      arac.gidecegiYer ||
      ""
    );

    setDuzenleAracTipi(
      arac.aracTipi ||
      ""
    );

    setDuzenleKapasite(
      arac.kapasite ||
      ""
    );

    setDuzenleAciklama(
      arac.aciklama ||
      ""
    );
  }

  // ==========================================
  // DÜZENLEMEYİ İPTAL ET
  // ==========================================

  function duzenlemeyiIptalEt() {
    setDuzenlenenAracId(
      ""
    );

    setDuzenleBulunduguYer(
      ""
    );

    setDuzenleGidecegiYer(
      ""
    );

    setDuzenleAracTipi(
      ""
    );

    setDuzenleKapasite(
      ""
    );

    setDuzenleAciklama(
      ""
    );
  }

  // ==========================================
  // ARAÇ GÜNCELLE
  // ==========================================

  async function aracGuncelle(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      arac.userId !==
      user.uid
    ) {
      setHata(
        "Bu araç ilanını düzenleme yetkin yok."
      );

      return;
    }

    const temizBulunduguYer =
      duzenleBulunduguYer.trim();

    const temizGidecegiYer =
      duzenleGidecegiYer.trim();

    const temizAracTipi =
      duzenleAracTipi.trim();

    const temizKapasite =
      duzenleKapasite.trim();

    const temizAciklama =
      duzenleAciklama.trim();

    if (
      temizBulunduguYer ===
        "" ||
      temizGidecegiYer ===
        "" ||
      temizAracTipi === "" ||
      temizKapasite === ""
    ) {
      setHata(
        "Lütfen gerekli alanları doldur."
      );

      return;
    }

    try {
      setIslemYapiliyor(
        arac.id
      );

      await updateDoc(
        doc(
          db,
          "araclar",
          arac.id
        ),
        {
          bulunduguYer:
            temizBulunduguYer,

          gidecegiYer:
            temizGidecegiYer,

          aracTipi:
            temizAracTipi,

          kapasite:
            temizKapasite,

          aciklama:
            temizAciklama,

          guncellenmeTarihi:
            serverTimestamp(),
        }
      );

      setBasari(
        "Boş araç ilanı güncellendi. ✏️✅"
      );

      duzenlemeyiIptalEt();
    } catch (error: any) {
      if (
        error?.code ===
        "permission-denied"
      ) {
        setHata(
          "Firebase bu işleme izin vermedi."
        );
      } else {
        setHata(
          "Araç ilanı güncellenirken bir hata oluştu."
        );
      }
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // ARAÇ İLANINI KAPAT
  // ==========================================

  async function aracKapat(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      arac.userId !==
      user.uid
    ) {
      setHata(
        "Bu araç ilanını kapatma yetkin yok."
      );

      return;
    }

    const onay =
      globalThis.confirm(
        "Bu boş araç ilanını kapatmak istediğine emin misin?"
      );

    if (!onay) {
      return;
    }

    try {
      setIslemYapiliyor(
        arac.id
      );

      await updateDoc(
        doc(
          db,
          "araclar",
          arac.id
        ),
        {
          durum:
            "Kapalı",

          kapanmaTarihi:
            serverTimestamp(),
        }
      );

      setBasari(
        "Boş araç ilanı kapatıldı. 🔒"
      );

      if (
        duzenlenenAracId ===
        arac.id
      ) {
        duzenlemeyiIptalEt();
      }
    } catch {
      setHata(
        "Araç ilanı kapatılırken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // ARAÇ İLANINI SİL
  // ==========================================

  async function aracSil(
    arac: Arac
  ) {
    setHata("");
    setBasari("");

    if (!girisKontrolEt()) {
      return;
    }

    if (!user) {
      return;
    }

    if (
      arac.userId !==
      user.uid
    ) {
      setHata(
        "Bu araç ilanını silme yetkin yok."
      );

      return;
    }

    const onay =
      globalThis.confirm(
        "Bu boş araç ilanını kalıcı olarak silmek istediğine emin misin?"
      );

    if (!onay) {
      return;
    }

    try {
      setIslemYapiliyor(
        arac.id
      );

      await deleteDoc(
        doc(
          db,
          "araclar",
          arac.id
        )
      );

      setBasari(
        "Boş araç ilanı silindi. 🗑️"
      );

      if (
        duzenlenenAracId ===
        arac.id
      ) {
        duzenlemeyiIptalEt();
      }
    } catch {
      setHata(
        "Araç ilanı silinirken bir hata oluştu."
      );
    } finally {
      setIslemYapiliyor(
        ""
      );
    }
  }

  // ==========================================
  // PROFİLE GİT
  // ==========================================

  function kullaniciProfilineGit(
    userId: string
  ) {
    if (!userId) {
      return;
    }

    router.push(
      `/kullanici/${userId}`
    );
  }

  // ==========================================
  // TELEFON ET
  // ==========================================

  function telefonEt(
    telefon: string
  ) {
    if (!telefon) {
      return;
    }

    const temizTelefon =
      telefon.replace(
        /\s+/g,
        ""
      );

    globalThis.location.href =
      `tel:${temizTelefon}`;
  }

  // ==========================================
  // FİYAT GÖSTER
  // ==========================================

  function fiyatGoster(
    fiyat: number,
    paraBirimi: string
  ) {
    const sembol =
      paraBirimi ===
      "USD"
        ? "$"
        : paraBirimi ===
          "EUR"
        ? "€"
        : "₺";

    return `${sembol}${Number(
      fiyat || 0
    ).toLocaleString(
      "tr-TR"
    )}`;
  }

  // ==========================================
  // YÜKLENİYOR
  // ==========================================

  if (
    profilYukleniyor
  ) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-5xl mb-4">
            🚛
          </div>

          <p className="text-xl font-bold">
            Yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // GİRİŞ YOK
  // ==========================================

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md">
          <div className="text-6xl mb-5">
            🔐
          </div>

          <h1 className="text-3xl font-extrabold">
            Giriş Yapmalısın
          </h1>

          <p className="text-gray-500 mt-4">
            Boş araç ilanlarını görmek ve ilan yayınlamak için hesabına giriş yapmalısın.
          </p>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/login"
              );
            }}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold"
          >
            Giriş Yap
          </button>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/"
              );
            }}
            className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white px-7 py-3 rounded-xl font-bold"
          >
            🏠 Ana Sayfa
          </button>
        </div>
      </main>
    );
  }

  // ==========================================
  // SAYFA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* BAŞLIK */}

        <div className="text-center mb-10">
          <div className="text-6xl mb-4">
            🚛
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-green-600">
            Boş Araçlar
          </h1>

          <p className="text-gray-500 text-base sm:text-lg mt-3">
            Uygun araçları bul, yükünü teklif et veya kendi boş araç ilanını yayınla.
          </p>

          <p className="text-sm font-semibold text-green-600 mt-2">
            Giriş yapan tüm kullanıcılar boş araç ilanı verebilir ve araçlara yük teklif edebilir.
          </p>
        </div>

        {/* HATA */}

        {hata !== "" && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 font-bold">
            ⚠️ {hata}
          </div>
        )}

        {/* BAŞARI */}

        {basari !== "" && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 mb-6 font-bold">
            {basari}
          </div>
        )}

        {/* ======================================
            BOŞ ARAÇ İLANI VER
        ====================================== */}

        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-600 mb-2">
            🚛 Boş Araç İlanı Ver
          </h2>

          <p className="text-gray-500 mb-8">
            Aracının konumunu, gideceği yeri ve kapasitesini paylaş.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <label className="block font-bold mb-2">
                📍 Araç Nerede?
              </label>

              <input
                type="text"
                value={
                  bulunduguYer
                }
                onChange={(
                  event
                ) => {
                  setBulunduguYer(
                    event.currentTarget
                      .value
                  );
                }}
                placeholder="Örn: İstanbul"
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">
                📍 Nereye Gidecek?
              </label>

              <input
                type="text"
                value={
                  gidecegiYer
                }
                onChange={(
                  event
                ) => {
                  setGidecegiYer(
                    event.currentTarget
                      .value
                  );
                }}
                placeholder="Örn: Ankara"
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block font-bold mb-2">
                🚛 Araç Tipi
              </label>

              <select
                value={
                  aracTipi
                }
                onChange={(
                  event
                ) => {
                  setAracTipi(
                    event.currentTarget
                      .value
                  );
                }}
                className="w-full border border-gray-300 rounded-xl p-4 bg-white outline-none focus:border-green-600"
              >
                <option value="">
                  Araç tipi seç
                </option>

                <option value="Kamyon">
                  Kamyon
                </option>

                <option value="Tır">
                  Tır
                </option>

                <option value="Kamyonet">
                  Kamyonet
                </option>

                <option value="Panelvan">
                  Panelvan
                </option>

                <option value="Frigo">
                  Frigo
                </option>

                <option value="Tenteli">
                  Tenteli
                </option>

                <option value="Açık Kasa">
                  Açık Kasa
                </option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-2">
                ⚖️ Taşıma Kapasitesi
              </label>

              <input
                type="text"
                value={
                  kapasite
                }
                onChange={(
                  event
                ) => {
                  setKapasite(
                    event.currentTarget
                      .value
                  );
                }}
                placeholder="Örn: 20 ton"
                className="w-full border border-gray-300 rounded-xl p-4 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold mb-2">
                📝 Açıklama
              </label>

              <textarea
                value={
                  aciklama
                }
                onChange={(
                  event
                ) => {
                  setAciklama(
                    event.currentTarget
                      .value
                  );
                }}
                placeholder="Araç hakkında ek bilgi..."
                rows={4}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-xl p-4 resize-none outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="text-sm text-gray-400 mt-2 text-right">
                {aciklama.length}/1000
              </p>
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={
                  aracOlustur
                }
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-extrabold text-lg"
              >
                {loading
                  ? "⏳ İlan yayınlanıyor..."
                  : "🚛 Boş Aracı Yayınla"}
              </button>
            </div>
          </div>
        </div>

        {/* ======================================
            ARAÇLAR
        ====================================== */}

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                🔎 Yayındaki Boş Araçlar
              </h2>

              <p className="text-gray-500 mt-1">
                Uygun aracı bul, yükünü teklif et veya araç sahibiyle iletişime geç.
              </p>
            </div>

            <div className="self-start sm:self-auto bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
              {araclar.length} araç
            </div>
          </div>

          {araclarYukleniyor ? (
            <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
              <p className="font-bold text-lg">
                🚛 Araçlar yükleniyor...
              </p>
            </div>
          ) : araclar.length ===
            0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
              <div className="text-6xl">
                🚛
              </div>

              <h3 className="text-2xl font-extrabold mt-5">
                Henüz boş araç ilanı yok
              </h3>

              <p className="text-gray-500 mt-3">
                İlk boş araç ilanını sen yayınlayabilirsin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {araclar.map(
                (arac) => {
                  const benimAracim =
                    user.uid ===
                    arac.userId;

                  const duzenleniyor =
                    duzenlenenAracId ===
                    arac.id;

                  const teklifPaneliAcik =
                    teklifVerilenAracId ===
                    arac.id;

                  return (
                    <div
                      key={
                        arac.id
                      }
                      className="bg-white rounded-3xl shadow-lg p-6"
                    >
                      {/* ROTA */}

                      <div className="flex items-start gap-3 mb-5">
                        <div className="bg-green-100 text-green-700 rounded-2xl p-3 text-2xl shrink-0">
                          🚛
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xl font-extrabold break-words">
                            {
                              arac.bulunduguYer
                            }
                            {" → "}
                            {
                              arac.gidecegiYer
                            }
                          </h3>

                          <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            🟢{" "}
                            {
                              arac.durum
                            }
                          </span>

                          {benimAracim && (
                            <span className="inline-block mt-2 ml-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                              👤 Benim İlanım
                            </span>
                          )}
                        </div>
                      </div>

                      {/* DÜZENLEME */}

                      {duzenleniyor ? (
                        <div className="border-t pt-5">
                          <h3 className="text-xl font-extrabold text-blue-700 mb-5">
                            ✏️ Araç İlanını Düzenle
                          </h3>

                          <div className="space-y-4">
                            <input
                              type="text"
                              value={
                                duzenleBulunduguYer
                              }
                              onChange={(
                                event
                              ) => {
                                setDuzenleBulunduguYer(
                                  event.currentTarget
                                    .value
                                );
                              }}
                              placeholder="Araç nerede?"
                              className="w-full border rounded-xl p-3"
                            />

                            <input
                              type="text"
                              value={
                                duzenleGidecegiYer
                              }
                              onChange={(
                                event
                              ) => {
                                setDuzenleGidecegiYer(
                                  event.currentTarget
                                    .value
                                );
                              }}
                              placeholder="Nereye gidecek?"
                              className="w-full border rounded-xl p-3"
                            />

                            <select
                              value={
                                duzenleAracTipi
                              }
                              onChange={(
                                event
                              ) => {
                                setDuzenleAracTipi(
                                  event.currentTarget
                                    .value
                                );
                              }}
                              className="w-full border rounded-xl p-3 bg-white"
                            >
                              <option value="Kamyon">
                                Kamyon
                              </option>
                              <option value="Tır">
                                Tır
                              </option>
                              <option value="Kamyonet">
                                Kamyonet
                              </option>
                              <option value="Panelvan">
                                Panelvan
                              </option>
                              <option value="Frigo">
                                Frigo
                              </option>
                              <option value="Tenteli">
                                Tenteli
                              </option>
                              <option value="Açık Kasa">
                                Açık Kasa
                              </option>
                            </select>

                            <input
                              type="text"
                              value={
                                duzenleKapasite
                              }
                              onChange={(
                                event
                              ) => {
                                setDuzenleKapasite(
                                  event.currentTarget
                                    .value
                                );
                              }}
                              placeholder="Kapasite"
                              className="w-full border rounded-xl p-3"
                            />

                            <textarea
                              value={
                                duzenleAciklama
                              }
                              onChange={(
                                event
                              ) => {
                                setDuzenleAciklama(
                                  event.currentTarget
                                    .value
                                );
                              }}
                              rows={3}
                              maxLength={1000}
                              placeholder="Açıklama"
                              className="w-full border rounded-xl p-3"
                            />

                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  aracGuncelle(
                                    arac
                                  );
                                }}
                                disabled={
                                  islemYapiliyor !==
                                  ""
                                }
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-bold"
                              >
                                💾 Kaydet
                              </button>

                              <button
                                type="button"
                                onClick={
                                  duzenlemeyiIptalEt
                                }
                                disabled={
                                  islemYapiliyor !==
                                  ""
                                }
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold"
                              >
                                ❌ İptal
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* BİLGİLER */}

                          <div className="space-y-3">
                            <p>
                              🚛{" "}
                              <strong>
                                Araç:
                              </strong>{" "}
                              {
                                arac.aracTipi
                              }
                            </p>

                            <p>
                              ⚖️{" "}
                              <strong>
                                Kapasite:
                              </strong>{" "}
                              {
                                arac.kapasite
                              }
                            </p>

                            {arac.aciklama && (
                              <p>
                                📝{" "}
                                <strong>
                                  Açıklama:
                                </strong>{" "}
                                {
                                  arac.aciklama
                                }
                              </p>
                            )}
                          </div>

                          {/* İLAN SAHİBİ */}

                          <div className="border-t mt-5 pt-5">
                            <p className="font-bold">
                              👤{" "}
                              {
                                arac.kullaniciAdi
                              }
                            </p>

                            {arac.kullaniciTelefonu && (
                              <p className="text-gray-500 mt-1">
                                📞{" "}
                                {
                                  arac.kullaniciTelefonu
                                }
                              </p>
                            )}
                          </div>

                          {/* BAŞKASININ ARACI */}

                          {!benimAracim && (
                            <div className="border-t mt-5 pt-5">

                              {/* YÜK TEKLİF ET */}

                              <button
                                type="button"
                                onClick={() => {
                                  yukTeklifiniAc(
                                    arac
                                  );
                                }}
                                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-4 rounded-xl font-extrabold text-lg"
                              >
                                📦 Yük Teklif Et
                              </button>

                              {/* AÇIK YÜK YOK */}

                              {yuklerim.length ===
                                0 && (
                                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                  <p className="text-yellow-700 font-bold">
                                    📦 Açık yük ilanınız yok.
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      router.push(
                                        "/yuk-ver"
                                      );
                                    }}
                                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold"
                                  >
                                    ➕ Yük İlanı Ver
                                  </button>
                                </div>
                              )}

                              {/* TEKLİF PANELİ */}

                              {teklifPaneliAcik &&
                                yuklerim.length >
                                  0 && (
                                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-5">
                                  <h4 className="text-lg font-extrabold text-orange-700">
                                    📦 Araca Yük Teklif Et
                                  </h4>

                                  <p className="text-gray-600 mt-2">
                                    Açık yük ilanlarından birini seç.
                                  </p>

                                  <select
                                    value={
                                      secilenYukId
                                    }
                                    onChange={(
                                      event
                                    ) => {
                                      setSecilenYukId(
                                        event
                                          .currentTarget
                                          .value
                                      );
                                    }}
                                    className="w-full mt-4 border border-orange-200 rounded-xl p-3 bg-white"
                                  >
                                    <option value="">
                                      Yük ilanını seç
                                    </option>

                                    {yuklerim.map(
                                      (
                                        yuk
                                      ) => (
                                        <option
                                          key={
                                            yuk.id
                                          }
                                          value={
                                            yuk.id
                                          }
                                        >
                                          {
                                            yuk.nereden
                                          }{" "}
                                          →{" "}
                                          {
                                            yuk.nereye
                                          }{" "}
                                          |{" "}
                                          {
                                            yuk.yukTuru
                                          }{" "}
                                          |{" "}
                                          {fiyatGoster(
                                            yuk.fiyat,
                                            yuk.paraBirimi
                                          )}
                                        </option>
                                      )
                                    )}
                                  </select>

                                  {secilenYukId &&
                                    (() => {
                                      const secilen =
                                        yuklerim.find(
                                          (
                                            yuk
                                          ) =>
                                            yuk.id ===
                                            secilenYukId
                                        );

                                      if (
                                        !secilen
                                      ) {
                                        return null;
                                      }

                                      return (
                                        <div className="mt-4 bg-white rounded-xl p-4 border border-orange-100 space-y-2">
                                          <p className="font-extrabold text-blue-700">
                                            📍{" "}
                                            {
                                              secilen.nereden
                                            }{" "}
                                            →{" "}
                                            {
                                              secilen.nereye
                                            }
                                          </p>

                                          <p>
                                            📦{" "}
                                            {
                                              secilen.yukTuru
                                            }
                                          </p>

                                          <p>
                                            ⚖️{" "}
                                            {
                                              secilen.agirlik
                                            }
                                          </p>

                                          <p className="font-extrabold text-green-600">
                                            💰{" "}
                                            {fiyatGoster(
                                              secilen.fiyat,
                                              secilen.paraBirimi
                                            )}
                                          </p>
                                        </div>
                                      );
                                    })()}

                                  <textarea
                                    value={
                                      yukTeklifMesaji
                                    }
                                    onChange={(
                                      event
                                    ) => {
                                      setYukTeklifMesaji(
                                        event
                                          .currentTarget
                                          .value
                                      );
                                    }}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Araç sahibine mesajın... Örn: Yüküm güzergahınıza uygun, ilgilenirseniz görüşebiliriz."
                                    className="w-full mt-4 border border-orange-200 rounded-xl p-3 resize-none"
                                  />

                                  <p className="text-right text-xs text-gray-400 mt-1">
                                    {
                                      yukTeklifMesaji.length
                                    }
                                    /500
                                  </p>

                                  <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                      type="button"
                                      disabled={
                                        yukTeklifiGonderiliyor ||
                                        !secilenYukId
                                      }
                                      onClick={() => {
                                        yukTeklifiGonder(
                                          arac
                                        );
                                      }}
                                      className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-4 py-3 rounded-xl font-extrabold"
                                    >
                                      {yukTeklifiGonderiliyor
                                        ? "⏳ Gönderiliyor..."
                                        : "📨 Teklifi Gönder"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={
                                        yukTeklifiGonderiliyor
                                      }
                                      onClick={() => {
                                        setTeklifVerilenAracId(
                                          ""
                                        );

                                        setSecilenYukId(
                                          ""
                                        );

                                        setYukTeklifMesaji(
                                          ""
                                        );
                                      }}
                                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-3 rounded-xl font-bold"
                                    >
                                      ❌ Vazgeç
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* PROFİL + TELEFON */}

                              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    kullaniciProfilineGit(
                                      arac.userId
                                    );
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  👤 Profili Gör
                                </button>

                                {arac.kullaniciTelefonu ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      telefonEt(
                                        arac.kullaniciTelefonu
                                      );
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold"
                                  >
                                    📞 Ara
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="bg-gray-300 text-gray-500 px-4 py-3 rounded-xl font-bold cursor-not-allowed"
                                  >
                                    📞 Telefon Yok
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* KENDİ ARACIM */}

                          {benimAracim && (
                            <div className="border-t mt-5 pt-5">
                              <p className="font-extrabold mb-3">
                                ⚙️ Araç İlanı Yönetimi
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    duzenlemeyiBaslat(
                                      arac
                                    );
                                  }}
                                  disabled={
                                    islemYapiliyor !==
                                      ""
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  ✏️ Düzenle
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    aracKapat(
                                      arac
                                    );
                                  }}
                                  disabled={
                                    islemYapiliyor !==
                                      ""
                                  }
                                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  🔒 Kapat
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    aracSil(
                                      arac
                                    );
                                  }}
                                  disabled={
                                    islemYapiliyor !==
                                      ""
                                  }
                                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-xl font-bold"
                                >
                                  🗑️ Sil
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* ALT BUTONLAR */}

        <div className="grid sm:grid-cols-3 gap-3 mt-10">
          <button
            type="button"
            onClick={() => {
              router.push(
                "/ilanlar"
              );
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold"
          >
            📋 Yük İlanları
          </button>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/gelen-teklifler"
              );
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold"
          >
            📥 Gelen Teklifler
          </button>

          <button
            type="button"
            onClick={() => {
              router.push(
                "/"
              );
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