// 429 intercept
const _orijinalFetch = window.fetch;
window._rateLimitVar = false;
window.fetch = async (...args) => {
    const res = await _orijinalFetch(...args);
    if (res.status === 429) {
        window._rateLimitVar = true;
        console.log('%c ⛔ 429 yakalandı!', 'background:#c0392b;color:white;padding:6px;');
    }
    return res;
};

(async () => {
    // ── Kontrol Paneli ─────────────────────────────────────────
    const panel = document.createElement('div');
    panel.id = 'kupon-panel';
    panel.style.cssText = `
        position:fixed; bottom:20px; right:20px; z-index:999999;
        background:#1a1a2e; border:1px solid #e94560; border-radius:12px;
        padding:14px; width:260px; font-family:Arial,sans-serif;
        box-shadow:0 4px 20px rgba(0,0,0,0.5); color:white; font-size:13px;
        cursor:move; user-select:none;
    `;
    panel.innerHTML = `
        <div id="panel-baslik" style="font-weight:bold;color:#e94560;margin-bottom:10px;font-size:14px;">
            🎯 Kupon Tarayıcı
            <span id="panel-durum" style="float:right;font-size:11px;color:#2ecc71;">● Çalışıyor</span>
        </div>
        <div style="margin-bottom:8px;font-size:12px;color:#95a5a6;">
            Sıradaki: <span id="panel-siradaki" style="color:#f39c12;">—</span>
        </div>
        <div style="margin-bottom:10px;font-size:12px;color:#95a5a6;">
            Başarılı: <span id="panel-basarili-sayac" style="color:#2ecc71;">0</span> kupon
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
            <button id="btn-duraklat" style="flex:1;padding:7px;border:none;border-radius:6px;background:#e67e22;color:white;cursor:pointer;font-weight:bold;font-size:12px;">⏸ Duraklat</button>
            <button id="btn-sifirla" style="flex:1;padding:7px;border:none;border-radius:6px;background:#c0392b;color:white;cursor:pointer;font-weight:bold;font-size:12px;">🗑 Listeyi Sil</button>
        </div>
        <div style="margin-bottom:6px;font-size:12px;color:#95a5a6;">Kupon Ekle (alt alta yaz):</div>
        <textarea id="panel-textarea" placeholder="KUPON1&#10;KUPON2&#10;KUPON3" style="width:100%;height:70px;background:#0f3460;border:1px solid #e94560;border-radius:6px;color:white;padding:6px;font-size:12px;resize:vertical;box-sizing:border-box;"></textarea>
        <button id="btn-ekle" style="width:100%;margin-top:6px;padding:7px;border:none;border-radius:6px;background:#2980b9;color:white;cursor:pointer;font-weight:bold;font-size:12px;">➕ Listeye Ekle</button>
        <div id="panel-basarili-liste" style="margin-top:8px;font-size:11px;color:#2ecc71;max-height:60px;overflow-y:auto;"></div>
    `;
    document.body.appendChild(panel);

    // Panel sürükleme
    let surukle = false, sx, sy, ox, oy;
    panel.addEventListener('mousedown', e => {
        if (['BUTTON','TEXTAREA'].includes(e.target.tagName)) return;
        surukle = true;
        sx = e.clientX; sy = e.clientY;
        ox = panel.offsetLeft; oy = panel.offsetTop;
    });
    document.addEventListener('mousemove', e => {
        if (!surukle) return;
        panel.style.left = (ox + e.clientX - sx) + 'px';
        panel.style.top  = (oy + e.clientY - sy) + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => surukle = false);
    // ──────────────────────────────────────────────────────────

    const kuponlar = [
        "IHTIYAC200", "200PAZARBAKIMI", "PAZAR200", "BURCINARDA250",
        "İNDİRİMLİALARM250", "ESRADAGDELEN250", "YAĞMURÖZEL250", "Esinle250", "Linanay250", "Evinhalleri250",
        "Serragozuak250", "Aycakarakus250", "MINECEBLOG250", "Hülya250", "Erva250", "Kubrabuyukduman250",
        "HAMIDASULEYMANLI250", "YUDUM250", "Kendimcebirblog250", "Seyhanaltun250", "Pelinozcan250",
        "İnterestevler250", "EMİNEMUHO250", "Halesemiz250", "ZEYNEQBOZAN250", "RETRODESEN250",
        "PACIKANINMUTFAGI250", "HAPPYFOODSS250", "Nebies250", "FEYZVLOG250", "SONAY250", "ARİKUSU250",
        "EDAARAS250", "GİZEMCE250", "WİTHZÜLEYHA250", "MELİSİMO250", "SEYDAGUZEL250", "MEDİNESALDIK250",
        "SÜMEYYE250", "İLAYDA150", "AYSUN250", "SALİHA250", "AMİNE250", "Aynur250", "Sukran250", "Şule250",
        "Gozde250", "MARKET200", "AYBÜKE250", "HELİN250", "ACMYZZMOSDBTVTJFLNDXJXMK", "CAGLA250",
        "MİMARİGÖZLER250", "Tansu250", "Huma250", "HULYA250", "DEMET250", "trendev250", "MURAT250",
        "200FIRSAT", "BUSE250", "EMINE250", "EBRU250", "ECE250", "CİGDEM250", "ECEM250", "EZGİ250",
        "CUMA200", "CERENLE250", "PEMBEPANJUR250", "DEKOR250", "OZGEERTIKARICI250", "BIYOLOG250",
        "GIYINHADİ250", "EBEAYSE250", "CEYIZ250", "INDIRIMCINIZ250", "INDIRIMGOZCUSU250",
        "FASHIONLANDIM250", "ANNELER250", "BAMBAM250", "EVIMICIN250"
    ];

    const basariliKuponlar = JSON.parse(localStorage.getItem('basariliKuponlar') || '[]');

    // Panel güncelleyiciler
    function panelGuncelle(siradaki) {
        document.getElementById('panel-siradaki').textContent = siradaki || '—';
        document.getElementById('panel-basarili-sayac').textContent = basariliKuponlar.length;
        const liste = document.getElementById('panel-basarili-liste');
        liste.textContent = basariliKuponlar.length > 0 ? '✅ ' + basariliKuponlar.join(', ') : '';
    }
    panelGuncelle();

    // ── Duraklat / Devam ──────────────────────────────────────
    let duraklatildi = false;

    document.getElementById('btn-duraklat').addEventListener('click', () => {
        duraklatildi = !duraklatildi;
        const btn = document.getElementById('btn-duraklat');
        const durum = document.getElementById('panel-durum');
        if (duraklatildi) {
            btn.textContent = '▶ Devam'; btn.style.background = '#27ae60';
            durum.textContent = '● Duraklatıldı'; durum.style.color = '#e67e22';
            console.log('%c ⏸️ DURAKLATILDI', 'background:#e67e22;color:white;padding:6px 12px;font-weight:bold;');
        } else {
            btn.textContent = '⏸ Duraklat'; btn.style.background = '#e67e22';
            durum.textContent = '● Çalışıyor'; durum.style.color = '#2ecc71';
            console.log('%c ▶️ DEVAM EDİYOR', 'background:#27ae60;color:white;padding:6px 12px;font-weight:bold;');
        }
    });

    async function duraklatKontrol() {
        while (duraklatildi) await new Promise(r => setTimeout(r, 1000));
    }

    // ── Listeyi Sil ───────────────────────────────────────────
    document.getElementById('btn-sifirla').addEventListener('click', () => {
        if (!confirm('Başarılı kupon listesi silinsin mi?')) return;
        basariliKuponlar.length = 0;
        localStorage.removeItem('basariliKuponlar');
        panelGuncelle();
        console.log('%c 🗑️ Başarılı kupon listesi sıfırlandı.', 'color:#e74c3c;font-weight:bold;');
    });

    // ── Kupon Ekle ────────────────────────────────────────────
    document.getElementById('btn-ekle').addEventListener('click', () => {
        const textarea = document.getElementById('panel-textarea');
        const yeniKuponlar = textarea.value
            .split('\n')
            .map(k => k.trim())
            .filter(k => k && !kuponlar.includes(k));
        if (yeniKuponlar.length === 0) {
            alert('Eklenecek yeni kupon bulunamadı (boş veya zaten listede).');
            return;
        }
        kuponlar.push(...yeniKuponlar);
        textarea.value = '';
        console.log(`%c ➕ ${yeniKuponlar.length} kupon eklendi: ${yeniKuponlar.join(', ')}`, 'background:#2980b9;color:white;padding:6px 12px;font-weight:bold;');
        alert(`${yeniKuponlar.length} kupon eklendi!`);
    });
    // ──────────────────────────────────────────────────────────

    function rastgeleSure(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function karistir(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function reactInputYaz(input, deger) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, deger);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    }

    function inputBul() {
        return (
            document.querySelector('input.input[placeholder*="İndirim"]') ||
            document.querySelector('input[placeholder*="İndirim Kodu"]') ||
            document.querySelector('input[placeholder*="indirim"]') ||
            [...document.querySelectorAll('input')].find(i =>
                i.placeholder && /indirim|kupon|kod/i.test(i.placeholder)
            )
        );
    }

    function butonBul() {
        return (
            document.querySelector('button.promotion-code-button') ||
            document.querySelector('[class*="promotion-code-button"]') ||
            [...document.querySelectorAll('button')].find(b =>
                b.innerText.trim() === 'Uygula'
            )
        );
    }

    function sonucKontrol() {
        const popupSelectors = [
            '[class*="modal"] p', '[class*="Modal"] p',
            '[class*="dialog"] p', '[class*="popup"] p'
        ];
        for (const s of popupSelectors) {
            const el = document.querySelector(s);
            if (el && el.innerText.trim()) return el.innerText.trim();
        }
        const selectors = [
            '[class*="promotion"][class*="error"]',
            '[class*="promotion"][class*="success"]',
            '[class*="coupon"][class*="error"]',
            '[class*="coupon"][class*="success"]',
            '[class*="error-message"]',
            '[class*="toast"]',
            '[class*="notification"]',
            '[class*="alert"]'
        ];
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el && el.innerText.trim()) return el.innerText.trim();
        }
        return null;
    }

    function basariliMiKontrol(sonuc) {
        if (!sonuc) return false;
        return /kupon uygulandı|indirim uygulandı|kazandınız|kod uygulandı|indiriminiz uygulandı/i.test(sonuc);
    }

    function rateLimitMiKontrol(sonuc) {
        if (!sonuc) return false;
        return /çok fazla deneme|too many|daha sonra tekrar|rate limit/i.test(sonuc);
    }

    function toplamFiyatAl() {
        const el =
            document.querySelector('[class*="total-price"]') ||
            document.querySelector('[class*="totalPrice"]') ||
            document.querySelector('[class*="order-total"]');
        return el ? el.innerText.trim() : null;
    }

    async function popupKapat() {
        const tamam =
            document.querySelector('[class*="modal"] button') ||
            document.querySelector('[class*="dialog"] button') ||
            document.querySelector('[class*="popup"] button') ||
            [...document.querySelectorAll('button')].find(b =>
                /^(tamam|kapat|ok|anladım)$/i.test(b.innerText.trim())
            );
        if (tamam) {
            tamam.click();
            await new Promise(r => setTimeout(r, rastgeleSure(600, 1200)));
        }
        const kapat =
            document.querySelector('[class*="modal"] [class*="close"]') ||
            document.querySelector('[class*="dialog"] [class*="close"]') ||
            document.querySelector('[aria-label*="kapat" i]') ||
            document.querySelector('[aria-label*="close" i]');
        if (kapat) {
            kapat.click();
            await new Promise(r => setTimeout(r, rastgeleSure(400, 800)));
        }
    }
let rateLimitSayac = 0;

async function rateLimitBekle() {
    rateLimitSayac++;
    const dakika = Math.min(5 * rateLimitSayac, 30); // 5, 10, 15... max 30 dk
    const sure = dakika * 60 * 1000;
        const bitis = Date.now() + sure;
        console.log('%c ⛔ Rate limit! 5 dakika bekleniyor...', 'background:#c0392b;color:white;padding:8px 12px;font-weight:bold;');
        const durum = document.getElementById('panel-durum');
        durum.textContent = '● Rate limit'; durum.style.color = '#e74c3c';

        while (Date.now() < bitis) {
            const kalan = Math.ceil((bitis - Date.now()) / 1000);
            console.log(`%c ⏳ Kalan: ${kalan} sn`, 'color:#e74c3c;font-style:italic;');
            document.getElementById('panel-siradaki').textContent = `⛔ ${kalan}sn bekliyor`;
            await new Promise(r => setTimeout(r, 30000));
        }

        durum.textContent = '● Çalışıyor'; durum.style.color = '#2ecc71';
        console.log('%c ✅ Bekleme bitti, devam ediliyor...', 'background:#27ae60;color:white;padding:6px 12px;font-weight:bold;');
    }

    console.log("%c 🎯 KUPON TARAYICI BAŞLADI ", "background:#1a1a2e;color:#e94560;padding:12px 20px;font-size:14px;font-weight:bold;");
    console.log(`%c 📦 Toplam: ${kuponlar.length} kupon | ✅ Önceden bulunan: ${basariliKuponlar.length}`, "color:#2980b9;font-weight:bold;");
    if (basariliKuponlar.length > 0) {
        console.log("%c ✅ Kayıtlı başarılı kuponlar: " + basariliKuponlar.join(', '), "color:#27ae60;font-weight:bold;");
    }

    let turSayisi = 0;

    while (true) {
        turSayisi++;
        const liste = karistir(kuponlar);
        console.log(`%c\n🔄 TUR ${turSayisi} — ${liste.length} kupon rastgele sırada`, "color:#8e44ad;font-weight:bold;");

        for (let i = 0; i < liste.length; i++) {
            await duraklatKontrol();
            await popupKapat();

            const input = inputBul();
            const buton = butonBul();

            if (!input || !buton) {
                console.warn(`⚠️ Element bulunamadı, 5 sn bekleniyor...`);
                await new Promise(r => setTimeout(r, 5000));
                i--;
                continue;
            }

            const kupon = liste[i];
            panelGuncelle(kupon);
            const oncekiFiyat = toplamFiyatAl();

            input.focus();
            await new Promise(r => setTimeout(r, rastgeleSure(150, 400)));
            reactInputYaz(input, '');
            await new Promise(r => setTimeout(r, rastgeleSure(100, 250)));
            reactInputYaz(input, kupon);

            await new Promise(r => setTimeout(r, rastgeleSure(600, 1200)));

            const butonGuncel = butonBul();
            if (!butonGuncel) continue;

            butonGuncel.disabled = false;
            butonGuncel.removeAttribute('disabled');
            butonGuncel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            await new Promise(r => setTimeout(r, rastgeleSure(50, 120)));
            butonGuncel.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            butonGuncel.click();

            console.log(`%c[${i + 1}/${liste.length}] 🔍 ${kupon}`, "color:#2980b9;");

            await new Promise(r => setTimeout(r, rastgeleSure(3000, 5000)));

            const sonuc = sonucKontrol();
            const sonrakiFiyat = toplamFiyatAl();

            if (rateLimitMiKontrol(sonuc) || window._rateLimitVar) {
                window._rateLimitVar = false;
                await rateLimitBekle();
                i--;
                continue;
            }

            const fiyatDustu = oncekiFiyat && sonrakiFiyat && oncekiFiyat !== sonrakiFiyat;
            const mesajBasarili = basariliMiKontrol(sonuc);

            if (fiyatDustu || mesajBasarili) {
                if (!basariliKuponlar.includes(kupon)) {
                    basariliKuponlar.push(kupon);
                    localStorage.setItem('basariliKuponlar', JSON.stringify(basariliKuponlar));
                }
                panelGuncelle(kupon);
                console.log(`%c ✅ BAŞARILI: ${kupon}${sonuc ? ' → ' + sonuc : ''}`, "background:#27ae60;color:white;padding:6px 12px;font-weight:bold;");
            } else if (sonuc) {
                console.log(`%c ❌ ${kupon} → ${sonuc}`, "color:#c0392b;");
            } else {
                console.log(`%c ⚪ ${kupon} → Sonuç alınamadı`, "color:#7f8c8d;");
            }

            await popupKapat();
            await duraklatKontrol();

            const bekle = rastgeleSure(8000, 30000);
            console.log(`%c ⏱️ ${(bekle / 1000).toFixed(1)} sn bekleniyor...`, "color:#95a5a6;font-style:italic;");
            await new Promise(r => setTimeout(r, bekle));
        }

        console.log(`%c\n🏁 TUR ${turSayisi} TAMAMLANDI`, "background:#2c3e50;color:#ecf0f1;padding:8px 16px;font-weight:bold;");
        if (basariliKuponlar.length > 0) {
            console.log(`%c ✅ Başarılı kuponlar: ${basariliKuponlar.join(', ')}`, "background:#27ae60;color:white;padding:6px 12px;font-weight:bold;");
        } else {
            console.log("%c ℹ️ Henüz başarılı kupon bulunamadı.", "color:#7f8c8d;");
        }

        const turBekle = rastgeleSure(30000, 60000);
        console.log(`%c ⏳ Yeni tur: ${(turBekle / 1000).toFixed(0)} sn sonra`, "color:#8e44ad;font-style:italic;");
        await new Promise(r => setTimeout(r, turBekle));
    }
})();