/* =========================================
   HASNURA TOPUP PAGE JS
   ========================================= */

'use strict';

const TOPUP_CONFIG = {
    webAppUrl: "https://script.google.com/macros/s/AKfycbyGXgb9grZJgHd_aJuRYgIOIX0-Kz97VjcGmDklS1Ufqydb5SAbsBPo4Ta8buG9AdFp/exec"
};

function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ── GENERATE PREVIEW & CODE ──────────────────────────
function generatePreview() {
    const name = document.getElementById('t-name').value.trim();
    const price = parseFloat(document.getElementById('t-price').value);
    const img = document.getElementById('t-img').value.trim();
    const cat = document.getElementById('t-cat').value;
    const info = document.getElementById('t-info').value.trim();
    const badge = document.getElementById('t-badge').value;
    const prodId = document.getElementById('t-id').value.trim();

    if (!name || !price || !img || !prodId) {
        showToast('⚠️ Sila isi Nama, Harga, Gambar dan ID Produk');
        return;
    }

    // Build HTML code
    const badgeHtml = badge
        ? `\n            <div class="card-badge">${badge}</div>`
        : '';
    const infoHtml = info
        ? `\n                <a href="${info}" target="_blank" class="btn-info">ℹ Info Produk</a>`
        : '';
    const cartName = name.replace(/'/g, "\\'");

    const code = `        <div class="product-card" data-category="${cat}" id="${prodId}">${badgeHtml}
            <div class="share-btn" title="Tahan untuk salin pautan" onpointerdown="startShareHold(this, '${prodId}', '${cartName}')" onpointerup="cancelShareHold()" onpointerleave="cancelShareHold()">🔗</div>
            <div class="product-img-wrap">
                <img class="product-img" src="${img}" alt="${name}" loading="lazy">
            </div>
            <div class="card-body">
                <div class="product-title">${name}</div>${infoHtml}
                <div class="price-row">
                    <div class="price-tag">RM ${price.toFixed(2)}</div>
                    <div class="stock-badge">Stok Ada</div>
                </div>
                <button class="btn-primary" onclick="addToCart('${cartName}', ${price.toFixed(2)})">
                    <span>🛒</span> Tambah Ke Troli
                </button>
            </div>
        </div>`;

    document.getElementById('code-output').textContent = code;

    // Preview card
    document.getElementById('preview-card').innerHTML = `
        <div style="font-family:'DM Sans',sans-serif;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #E8E4DC;position:relative;">
            ${badge ? `<div style="position:absolute;top:12px;left:12px;background:#0D0D0D;color:#C8A96E;font-size:10px;font-weight:700;padding:4px 10px;border-radius:50px;z-index:1;">${badge}</div>` : ''}
            <img src="${img}" alt="${name}" style="width:100%;aspect-ratio:1/1;object-fit:cover;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22280%22><rect fill=%22%23F8F7F4%22 width=%22280%22 height=%22280%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23ccc%22>Gambar Error</text></svg>'">
            <div style="padding:16px;">
                <div style="font-weight:700;font-size:14px;color:#1A1A1A;margin-bottom:10px;">${name}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#0D0D0D;">RM ${price.toFixed(2)}</span>
                    <span style="font-size:10px;color:#2D9E6B;background:rgba(45,158,107,0.1);padding:4px 10px;border-radius:50px;font-weight:700;">Stok Ada</span>
                </div>
                <button style="background:#0D0D0D;color:#fff;border:none;padding:12px;border-radius:14px;width:100%;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">🛒 Tambah Ke Troli</button>
            </div>
        </div>
    `;

    // Save to Sheets
    saveProductToSheets({ name, price: price.toFixed(2), cat, img, info, badge, prodId });
    showToast('✅ Pratonton & kod dijana!');
}

// ── SAVE TO GOOGLE SHEETS ────────────────────────────
function saveProductToSheets(product) {
    fetch(TOPUP_CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'addProduct',
            data: [
                new Date().toLocaleString('ms-MY'),
                product.prodId,
                product.name,
                'RM ' + product.price,
                product.cat,
                product.img,
                product.info,
                product.badge,
                'Aktif'
            ]
        })
    }).catch(e => console.warn(e));
}

// ── COPY CODE ────────────────────────────────────────
function copyCode() {
    const code = document.getElementById('code-output').textContent;
    if (!code || code.startsWith('//')) {
        showToast('⚠️ Jana kod dahulu!');
        return;
    }
    navigator.clipboard.writeText(code).then(() => {
        showToast('✅ Kod HTML disalin! Tampal dalam index.html');
    }).catch(() => {
        showToast('Sila salin kod secara manual');
    });
}

// ── LOAD PRODUCTS FROM SHEETS ────────────────────────
async function loadProducts() {
    const table = document.getElementById('products-table');
    table.innerHTML = `<div class="loading-state" style="padding:40px;"><div class="spinner" style="width:30px;height:30px;border:3px solid #E8E4DC;border-top-color:#C8A96E;border-radius:50%;animation:spin 0.8s linear infinite;"></div><p style="color:#9E9E9E;margin-top:12px;">Memuatkan...</p></div>`;

    try {
        const res = await fetch(`${TOPUP_CONFIG.webAppUrl}?action=getProducts`);
        const data = await res.json();

        if (data && data.products && data.products.length > 0) {
            renderProducts(data.products);
        } else {
            table.innerHTML = `<div style="padding:40px;text-align:center;color:#9E9E9E;">Tiada produk disimpan dalam Sheets lagi. Jana kod produk di atas untuk mula.</div>`;
        }
    } catch (e) {
        table.innerHTML = `<div style="padding:40px;text-align:center;color:#9E9E9E;">Tidak dapat sambung ke Sheets. Pastikan GAS URL dikemaskini.</div>`;
    }
}

function renderProducts(products) {
    const table = document.getElementById('products-table');
    const header = `<div class="product-row product-row-header">
        <span>Nama Produk</span>
        <span>Harga</span>
        <span>Kategori</span>
        <span>Status</span>
    </div>`;
    const rows = products.map(p => `
        <div class="product-row">
            <span style="font-weight:600;color:#0D0D0D;">${p.nama || p[2] || '—'}</span>
            <span style="font-weight:700;color:#C8A96E;">${p.harga || p[3] || '—'}</span>
            <span style="color:#6B6B6B;font-size:12px;">${p.kategori || p[4] || '—'}</span>
            <span style="font-size:11px;font-weight:700;color:#2D9E6B;">${p.status || p[8] || 'Aktif'}</span>
        </div>
    `).join('');
    table.innerHTML = header + rows;
}

// Inline spinner keyframe for topup
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
