export default function KullanimKosullariPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700">
          Kullanım Koşulları
        </h1>

        <p className="text-gray-500 mt-3">
          Son güncelleme: 9 Eylül 2026
        </p>

        <div className="mt-8 space-y-8 text-gray-700 leading-7">
          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              1. Genel Hükümler
            </h2>

            <p>
              Bu Kullanım Koşulları, YÜKLİN internet sitesini ve YÜKLİN
              üzerinden sunulan hizmetleri kullanan tüm kullanıcılar için
              geçerlidir.
            </p>

            <p className="mt-3">
              YÜKLİN internet sitesi:
              {" "}
              <strong>https://yuklin.com.tr</strong>
            </p>

            <p className="mt-3">
              Platformu kullanan kullanıcılar, yürürlükteki mevzuata ve bu
              Kullanım Koşullarına uygun hareket etmekle yükümlüdür.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              2. YÜKLİN'in Amacı
            </h2>

            <p>
              YÜKLİN; yük sahipleri ile taşıma hizmeti sunmak isteyen
              kullanıcıların ilan, teklif ve iletişim yoluyla bir araya
              gelmesini sağlayan dijital bir platformdur.
            </p>

            <p className="mt-3">
              YÜKLİN, aksi açıkça belirtilmediği sürece taşıma hizmetinin
              doğrudan sağlayıcısı veya taşıma sözleşmesinin tarafı değildir.
              Taşıma hizmetine ilişkin şartlar, platform üzerinden iletişim
              kuran kullanıcılar arasında belirlenir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              3. Üyelik
            </h2>

            <p>
              Platformun bazı özelliklerinden yararlanmak için kullanıcı
              hesabı oluşturulması gerekebilir.
            </p>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                Kullanıcı, kayıt sırasında verdiği bilgilerin doğru ve güncel
                olmasından sorumludur.
              </li>

              <li>
                Başkasına ait bilgiler izinsiz şekilde kullanılamaz.
              </li>

              <li>
                Kullanıcı hesabının ve şifresinin güvenliği kullanıcının
                sorumluluğundadır.
              </li>

              <li>
                Kullanıcı hesabının yetkisiz kullanıldığının fark edilmesi
                halinde YÜKLİN'e bildirim yapılmalıdır.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              4. İlanlar
            </h2>

            <p>
              Kullanıcılar YÜKLİN üzerinden yük veya boş araç ilanı
              oluşturabilir.
            </p>

            <p className="mt-3">
              İlanı oluşturan kullanıcı, ilanda yer alan bilgilerin
              doğruluğundan ve hukuka uygunluğundan sorumludur.
            </p>

            <p className="mt-3">
              Yanıltıcı, gerçeğe aykırı, hukuka aykırı veya üçüncü kişilerin
              haklarını ihlal eden ilanların yayınlanması yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              5. Teklifler ve Anlaşmalar
            </h2>

            <p>
              Kullanıcılar platformdaki uygun ilanlara teklif verebilir.
              Teklifin kabul edilmesi halinde taraflar arasında taşıma
              sürecine ilişkin bir anlaşma oluşabilir.
            </p>

            <p className="mt-3">
              Fiyat, yükün niteliği, teslim alma ve teslim etme zamanı,
              güzergâh, taşıma şartları ve diğer koşulların doğruluğunu ve
              uygunluğunu kontrol etmek tarafların sorumluluğundadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              6. Kullanıcıların Sorumlulukları
            </h2>

            <p>Kullanıcılar:</p>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Platformu hukuka uygun şekilde kullanmalıdır.</li>
              <li>Doğru ve güncel bilgi vermelidir.</li>
              <li>
                Taşınması yasak veya mevzuata aykırı yükler için ilan
                oluşturmamalıdır.
              </li>
              <li>
                Gerekli ruhsat, izin, yetki belgesi, sigorta veya diğer yasal
                gerekliliklerden kendileri sorumludur.
              </li>
              <li>
                Diğer kullanıcıları yanıltıcı veya zarara uğratıcı davranışta
                bulunmamalıdır.
              </li>
              <li>
                Platform üzerinden elde ettiği kişisel bilgileri amacı dışında
                kullanmamalıdır.
              </li>
              <li>
                Platformun güvenliğini veya çalışmasını bozacak işlemler
                yapmamalıdır.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              7. Yasaklı Kullanımlar
            </h2>

            <p>Aşağıdaki davranışlara izin verilmez:</p>

            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Sahte veya yanıltıcı hesap oluşturmak.</li>
              <li>Sahte ilan veya teklif oluşturmak.</li>
              <li>Başka bir kullanıcıyı taklit etmek.</li>
              <li>Dolandırıcılık veya hukuka aykırı faaliyet yürütmek.</li>
              <li>
                Diğer kullanıcılara tehdit, taciz veya hakaret içeren mesajlar
                göndermek.
              </li>
              <li>
                Platforma zarar vermeye veya yetkisiz erişim sağlamaya
                çalışmak.
              </li>
              <li>
                Virüs, zararlı yazılım veya benzeri zararlı içerik göndermek.
              </li>
              <li>
                Yürürlükteki mevzuata aykırı mal veya hizmetler için platformu
                kullanmak.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              8. Taşıma ve Teslimat
            </h2>

            <p>
              Yükün teslim alınması, taşınması, korunması ve teslim edilmesine
              ilişkin fiili süreç taşıma işleminin taraflarının
              sorumluluğundadır.
            </p>

            <p className="mt-3">
              Tarafların taşıma öncesinde yükün niteliği, miktarı, ağırlığı,
              teslimat bilgileri ve özel taşıma şartları gibi önemli bilgileri
              karşılıklı olarak doğrulamaları önerilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              9. Ücret ve Ödeme
            </h2>

            <p>
              YÜKLİN üzerinde gelecekte ücretli üyelik, komisyon, ödeme
              sistemi veya başka ücretli hizmetlerin sunulması halinde ilgili
              ücretler ve ödeme koşulları kullanıcıya işlem öncesinde ayrıca
              bildirilecektir.
            </p>

            <p className="mt-3">
              Platform üzerinde doğrudan ödeme hizmeti bulunmadığı sürece,
              kullanıcıların kendi aralarında gerçekleştirdiği ödemelerden
              taraflar kendileri sorumludur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              10. Puanlama ve Değerlendirmeler
            </h2>

            <p>
              Kullanıcılar tamamlanan işlemler sonrasında diğer kullanıcıları
              değerlendirebilir.
            </p>

            <p className="mt-3">
              Değerlendirmelerin gerçek deneyime dayanması, yanıltıcı olmaması
              ve hakaret, tehdit veya hukuka aykırı içerik barındırmaması
              gerekir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              11. İçeriklerin Kaldırılması ve Hesap İşlemleri
            </h2>

            <p>
              YÜKLİN; bu koşullara, yürürlükteki mevzuata veya platform
              güvenliğine aykırı olduğu değerlendirilen ilan, mesaj,
              değerlendirme veya diğer içerikler hakkında gerekli önlemleri
              alabilir.
            </p>

            <p className="mt-3">
              Ciddi veya tekrarlanan ihlaller halinde ilgili kullanıcı
              hesabının erişimi sınırlandırılabilir veya hesap kapatılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              12. Hizmetin Kullanılabilirliği
            </h2>

            <p>
              YÜKLİN'in kesintisiz veya hatasız çalışacağı garanti edilmez.
              Bakım, güncelleme, teknik arıza, internet altyapısı veya üçüncü
              taraf hizmetlerden kaynaklanan nedenlerle hizmet geçici olarak
              kesintiye uğrayabilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              13. Sorumluluğun Sınırları
            </h2>

            <p>
              YÜKLİN, kullanıcıların birbirleriyle iletişim kurmasını
              kolaylaştıran bir platformdur. Kullanıcılar arasındaki taşıma
              işlemlerinin şartları ve tarafların yükümlülükleri ilgili
              taraflar arasında belirlenir.
            </p>

            <p className="mt-3">
              YÜKLİN'in kanunen bertaraf edilemeyecek sorumlulukları saklı
              kalmak üzere; kullanıcıların yanlış veya eksik bilgi vermesi,
              taraflar arasındaki uyuşmazlıklar veya kullanıcıların kendi
              eylemlerinden kaynaklanan sonuçlar bakımından sorumluluk,
              yürürlükteki mevzuat çerçevesinde değerlendirilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              14. Kişisel Veriler ve Gizlilik
            </h2>

            <p>
              Kişisel verilerin işlenmesine ilişkin ayrıntılar KVKK
              Aydınlatma Metni ve Gizlilik Politikası içerisinde
              açıklanmaktadır.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <a
                href="/kvkk"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-3 rounded-xl font-bold text-center"
              >
                KVKK Aydınlatma Metni
              </a>

              <a
                href="/gizlilik"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-3 rounded-xl font-bold text-center"
              >
                Gizlilik Politikası
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              15. Fikri Mülkiyet
            </h2>

            <p>
              YÜKLİN'e ait marka, tasarım, yazılım, logo, metin ve diğer
              içerikler üzerindeki haklar, ilgili hak sahiplerine aittir.
              Yasal izin veya açık izin bulunmadıkça bu içerikler izinsiz
              şekilde kopyalanamaz veya ticari amaçlarla kullanılamaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              16. Değişiklikler
            </h2>

            <p>
              Bu Kullanım Koşulları, platformun gelişmesi veya mevzuatta
              meydana gelen değişiklikler nedeniyle güncellenebilir. Güncel
              metin YÜKLİN internet sitesi üzerinden yayımlanır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-3">
              17. İletişim
            </h2>

            <p>
              Kullanım koşulları veya platformla ilgili sorular için:
            </p>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p>
                <strong>İletişim e-postası:</strong>{" "}
                [ILETISIM E-POSTASI]
              </p>

              <p className="mt-2">
                <strong>İnternet sitesi:</strong>{" "}
                https://yuklin.com.tr
              </p>
            </div>
          </section>

          <section className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
            <h2 className="font-extrabold text-gray-900">
              Önemli Not
            </h2>

            <p className="mt-2">
              Bu metin YÜKLİN'in mevcut pilot sürümündeki işleyişe göre
              hazırlanmış genel bir taslaktır. Platform ticari faaliyete
              geçtiğinde; ücret, komisyon, ödeme, taşıma sorumluluğu, şirket
              bilgileri ve diğer ticari şartlara göre metin yeniden gözden
              geçirilmelidir.
            </p>
          </section>

          <div className="pt-4">
            <a
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
            >
              ← Ana Sayfaya Dön
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}