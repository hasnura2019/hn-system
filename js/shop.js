/* =========================================
   HASNURA SHOP — Main JavaScript
   ========================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────
const CONFIG = {
    webAppUrl: "https://script.google.com/macros/s/AKfycbyGXgb9grZJgHd_aJuRYgIOIX0-Kz97VjcGmDklS1Ufqydb5SAbsBPo4Ta8buG9AdFp/exec",
    whatsappNumber: "601119471916",
    shopName: "HASNURA SHOP"
};

// ── STATE ────────────────────────────────────────────
let cart = [];
let holdTimer = null;
let holdTarget = null;

// ── TOAST ────────────────────────────────────────────
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ── CATEGORY FILTER ──────────────────────────────────
function filterCategory(cat, btn) {
    const cards = document.querySelectorAll('.product-card');
    const btns = document.querySelectorAll('.cat-btn');
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    cards.forEach(card => {
        const match = cat === 'all' || card.getAttribute('data-category') === cat;
        card.style.display = match ? '' : 'none';
    });
    btn.closest('.cat-wrapper').scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

// ── HOLD TO COPY CATEGORY LINK ───────────────────────
// Usage: hold cat button > 800ms to copy category link
document.querySelectorAll('.cat-btn').forEach(btn => {
    let catTimer = null;

    btn.addEventListener('pointerdown', () => {
        btn.classList.add('holding');
        catTimer = setTimeout(() => {
            const catWrapper = btn.closest('.cat-wrapper');
            const cat = catWrapper ? catWrapper.getAttribute('data-cat') : 'all';
            const baseUrl = window.location.origin + window.location.pathname;
            const url = `${baseUrl}?cat=${encodeURIComponent(cat)}`;
            navigator.clipboard.writeText(url).then(() => {
                showToast(`✅ Pautan kategori disalin!`);
            }).catch(() => {
                showToast(`📋 Salin: ${url}`);
            });
            btn.classList.remove('holding');
        }, 800);
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
        btn.addEventListener(ev, () => {
            clearTimeout(catTimer);
            btn.classList.remove('holding');
        });
    });
});

// ── HOLD TO COPY PRODUCT LINK ────────────────────────
function startShareHold(el, prodId, prodName) {
    el.classList.add('holding');
    holdTarget = { el, prodId, prodName };
    holdTimer = setTimeout(() => {
        const url = window.location.href.split('?')[0].split('#')[0] + '#' + prodId;
        navigator.clipboard.writeText(url).then(() => {
            showToast(`🔗 Pautan "${prodName}" disalin!`);
        }).catch(() => {
            showToast(`📋 Salin: ${url}`);
        });
        el.classList.remove('holding');
        holdTarget = null;
    }, 800);
}

function cancelShareHold() {
    clearTimeout(holdTimer);
    if (holdTarget) {
        holdTarget.el.classList.remove('holding');
        holdTarget = null;
    }
}

// ── CART ─────────────────────────────────────────────
function addToCart(name, price) {
    const idx = cart.findIndex(i => i.name === name);
    if (idx > -1) {
        cart[idx].qty += 1;
    } else {
        cart.push({ name, price, qty: 1 });
    }
    updateCart();
    showToast(`🛒 ${name} ditambah ke troli!`);

    // Show cart button
    const cartBtn = document.getElementById('cartBtn');
    cartBtn.classList.add('visible');
}

function changeQty(idx, delta) {
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCart();
}

function updateCart() {
    const count = cart.reduce((t, i) => t + i.qty, 0);
    document.getElementById('cart-count').textContent = count;

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const sub = item.price * item.qty;
        total += sub;
        html += `
        <div class="cart-list-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">RM ${item.price.toFixed(2)} / unit</div>
            </div>
            <div class="qty-control">
                <button class="qty-btn" onclick="changeQty(${index}, -1)">−</button>
                <span class="qty-count">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
            </div>
            <div class="cart-item-sub">RM ${sub.toFixed(2)}</div>
        </div>`;
    });

    document.getElementById('cart-items-container').innerHTML = html;
    document.getElementById('display-total').textContent = 'RM ' + total.toFixed(2);

    const cartBtn = document.getElementById('cartBtn');
    if (count === 0) {
        document.getElementById('checkout-section').style.display = 'none';
        cartBtn.classList.remove('visible');
    }
}

function showCheckout() {
    const section = document.getElementById('checkout-section');
    section.style.display = 'block';
    setTimeout(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ── FINALIZE ORDER ───────────────────────────────────
function finalizeOrder() {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const addr = document.getElementById('custAddr').value.trim();

    if (!name || !phone || !addr) {
        showToast('⚠️ Sila lengkapkan semua maklumat penghantaran.');
        return;
    }

    let details = '';
    let itemSummary = '';
    let total = 0;

    cart.forEach((item, index) => {
        details += `${index + 1}. ${item.name} x${item.qty} — RM${(item.price * item.qty).toFixed(2)}%0A`;
        itemSummary += `${item.name} (x${item.qty}), `;
        total += item.price * item.qty;
    });

    // Save to Google Sheets
    const dataHantar = {
        kategori: "ShopOnline",
        data: [
            new Date().toLocaleString('ms-MY'),
            name,
            phone,
            addr,
            itemSummary.slice(0, -2),
            'RM ' + total.toFixed(2),
            'Baharu'
        ]
    };

    fetch(CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataHantar)
    }).catch(err => console.warn('Sheets error:', err));

    // WhatsApp Message
    const msg =
        `*🛍️ PESANAN BARU — ${CONFIG.shopName}*%0A%0A` +
        `*Nama:* ${name}%0A` +
        `*No. Telefon:* ${phone}%0A` +
        `*Alamat:* ${addr}%0A%0A` +
        `*Pesanan:*%0A${details}%0A` +
        `*JUMLAH PRODUK: RM ${total.toFixed(2)}*%0A%0A` +
        `_Nota: Kos penghantaran akan dimaklumkan oleh admin. COD / Postage._`;

    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');
}

// ── URL PARAMS ───────────────────────────────────────
window.addEventListener('load', () => {
    // Category filter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
        const wrapper = document.querySelector(`.cat-wrapper[data-cat="${catParam}"]`);
        if (wrapper) {
            const btn = wrapper.querySelector('.cat-btn');
            if (btn) filterCategory(catParam, btn);
        }
    }

    // Product hash scroll
    const hash = window.location.hash;
    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.classList.add('blink-active');
                setTimeout(() => target.classList.remove('blink-active'), 3000);
            }, 600);
        }
    }
});
