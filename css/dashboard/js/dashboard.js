/* =========================================
   HASNURA ADMIN DASHBOARD JS
   ========================================= */

'use strict';

// ── CONFIG ──────────────────────────────────────────
const CONFIG = {
    webAppUrl: "https://script.google.com/macros/s/AKfycbx-vafxPI9THw0uMw8IlndWyI5ohs7aJxofkJJMGeBPqVs0s7l4r6O_wDO8ll7X7w7KOw/exec",
    whatsappNumber: "601119471916",
    // Simpan password dalam Google Apps Script sahaja untuk keselamatan
    // Password ini adalah sementara — tukar dalam GAS
    adminPw: "Hasnura9697"
};

// ── STATE ────────────────────────────────────────────
let allOrders = [];
let currentOrder = null;

// ── TOAST ────────────────────────────────────────────
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ── LOGIN ────────────────────────────────────────────
function loginAdmin() {
    const pw = document.getElementById('admin-pw').value;
    const errEl = document.getElementById('login-err');

    if (pw === CONFIG.adminPw) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        document.body.style.display = 'block';
        document.body.style.background = '#F8F7F4';
        document.body.style.alignItems = 'unset';
        document.body.style.justifyContent = 'unset';
        loadOrders();
    } else {
        errEl.textContent = '❌ Kata laluan salah. Cuba lagi.';
        document.getElementById('admin-pw').value = '';
        setTimeout(() => { errEl.textContent = ''; }, 3000);
    }
}

function logoutAdmin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('admin-pw').value = '';
    allOrders = [];
}

// ── LOAD ORDERS FROM GOOGLE SHEETS ──────────────────
async function loadOrders() {
    document.getElementById('orders-loading').style.display = 'flex';
    document.getElementById('orders-list').innerHTML = '';

    try {
        const res = await fetch(`${CONFIG.webAppUrl}?action=getOrders`);
        const data = await res.json();

        if (data && data.orders) {
            allOrders = data.orders;
            renderOrders(allOrders);
            updateStats(allOrders);
        } else {
            // Demo mode if no real data
            allOrders = getDemoOrders();
            renderOrders(allOrders);
            updateStats(allOrders);
        }
    } catch (err) {
        console.warn('Menggunakan data demo:', err);
        allOrders = getDemoOrders();
        renderOrders(allOrders);
        updateStats(allOrders);
    }

    document.getElementById('orders-loading').style.display = 'none';
}

// Demo orders for testing
function getDemoOrders() {
    return [
        { id: 1, tarikh: '23/5/2026, 10:30', nama: 'Siti Hasnura Ahmad', telefon: '011-2345 6789', alamat: 'No 12, Jalan Mawar, Taman Setia, 24000 Kemaman, Terengganu', pesanan: 'Sambal Ikan Bilis (x2), Pekasam Daging (x1)', jumlah: 'RM 52.00', status: 'Baharu' },
        { id: 2, tarikh: '22/5/2026, 15:45', nama: 'Ahmad Faizal Razak', telefon: '012-8765 4321', alamat: 'No 5, Lorong Damai 3, 15000 Kota Bharu, Kelantan', pesanan: 'Borong 10 Ikan Lampan (x1)', jumlah: 'RM 80.00', status: 'Diproses' },
        { id: 3, tarikh: '21/5/2026, 9:15', nama: 'Nurul Ain Syafiqah', telefon: '019-1234 5678', alamat: 'Blok B-11-3, Apartment Damai, Jalan Ampang, 50450 Kuala Lumpur', pesanan: 'Kerepek Pisang Manis (x3), Sambal Bilko (x1)', jumlah: 'RM 62.00', status: 'Dihantar' },
        { id: 4, tarikh: '20/5/2026, 14:20', nama: 'Mohd Hazwan Idris', telefon: '013-9876 5432', alamat: 'No 88, Jalan Tun Hussain, 70000 Seremban, Negeri Sembilan', pesanan: 'Pekasam Telur Sotong (x2), Sambal Spicy Cute (x2)', jumlah: 'RM 50.00', status: 'Selesai' },
    ];
}

// ── RENDER ORDERS ────────────────────────────────────
function renderOrders(orders) {
    const list = document.getElementById('orders-list');

    if (orders.length === 0) {
        list.innerHTML = `<div class="empty-state"><h3>Tiada pesanan dijumpai</h3><p>Cuba tukar penapis carian</p></div>`;
        return;
    }

    list.innerHTML = orders.map((order, idx) => `
        <div class="order-card" onclick="openModal(${idx})">
            <div class="order-meta">
                <div class="order-name">${escHtml(order.nama)}</div>
                <div class="order-info">📞 ${escHtml(order.telefon)} &nbsp;|&nbsp; 🕐 ${escHtml(order.tarikh)}</div>
                <div class="order-items">🛍️ ${escHtml(order.pesanan)}</div>
            </div>
            <div class="order-right">
                <div class="order-amount">${escHtml(order.jumlah)}</div>
                <span class="status-pill status-${escHtml(order.status)}">${escHtml(order.status)}</span>
                <button class="btn-copy-card" onclick="event.stopPropagation(); copyInvoice(${idx})">📋 Copy Invois</button>
            </div>
        </div>
    `).join('');
}

function escHtml(str) {
    if (!str) return '—';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── STATS ────────────────────────────────────────────
function updateStats(orders) {
    document.getElementById('stat-total').textContent = orders.length;
    document.getElementById('stat-new').textContent = orders.filter(o => o.status === 'Baharu').length;
    document.getElementById('stat-done').textContent = orders.filter(o => o.status === 'Selesai').length;

    const total = orders.reduce((sum, o) => {
        const num = parseFloat((o.jumlah || '0').replace(/[^0-9.]/g, '')) || 0;
        return sum + num;
    }, 0);
    document.getElementById('stat-revenue').textContent = 'RM ' + total.toFixed(2);
}

// ── FILTER ───────────────────────────────────────────
function filterOrders() {
    const q = document.getElementById('search-input').value.toLowerCase();
    const status = document.getElementById('status-filter').value;

    const filtered = allOrders.filter(o => {
        const matchQ = !q || 
            (o.nama && o.nama.toLowerCase().includes(q)) ||
            (o.telefon && o.telefon.includes(q)) ||
            (o.alamat && o.alamat.toLowerCase().includes(q)) ||
            (o.pesanan && o.pesanan.toLowerCase().includes(q));
        const matchStatus = !status || o.status === status;
        return matchQ && matchStatus;
    });

    renderOrders(filtered);
}

// ── COPY INVOICE ─────────────────────────────────────
function copyInvoice(idx) {
    const o = allOrders[idx];
    const text = buildInvoiceText(o);
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Detail invois disalin!');
    }).catch(() => {
        showToast('📋 Sila salin secara manual');
    });
}

function buildInvoiceText(o) {
    return [
        '═══════════════════════════',
        '     HASNURA SHOP',
        '═══════════════════════════',
        `Tarikh  : ${o.tarikh || '—'}`,
        `Nama    : ${o.nama || '—'}`,
        `Tel     : ${o.telefon || '—'}`,
        `Alamat  : ${o.alamat || '—'}`,
        '───────────────────────────',
        `Pesanan : ${o.pesanan || '—'}`,
        '───────────────────────────',
        `Jumlah  : ${o.jumlah || '—'}`,
        `Status  : ${o.status || '—'}`,
        '═══════════════════════════',
        'Terima kasih kerana membeli!',
        'WA: wa.me/601119471916',
    ].join('\n');
}

// ── MODAL ────────────────────────────────────────────
function openModal(idx) {
    currentOrder = allOrders[idx];
    const o = currentOrder;

    document.getElementById('modal-content').innerHTML = `
        <div class="detail-row"><span class="detail-key">Tarikh</span><span class="detail-val">${escHtml(o.tarikh)}</span></div>
        <div class="detail-row"><span class="detail-key">Nama</span><span class="detail-val">${escHtml(o.nama)}</span></div>
        <div class="detail-row"><span class="detail-key">No. Telefon</span><span class="detail-val">${escHtml(o.telefon)}</span></div>
        <div class="detail-row"><span class="detail-key">Alamat</span><span class="detail-val">${escHtml(o.alamat)}</span></div>
        <div class="detail-row"><span class="detail-key">Pesanan</span><span class="detail-val">${escHtml(o.pesanan)}</span></div>
        <div class="detail-row"><span class="detail-key">Jumlah</span><span class="detail-val" style="font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#0D0D0D;">${escHtml(o.jumlah)}</span></div>
        <div class="detail-row"><span class="detail-key">Status</span><span class="detail-val"><span class="status-pill status-${escHtml(o.status)}">${escHtml(o.status)}</span></span></div>
        <div class="status-changer">
            <span style="font-size:11px;font-weight:700;color:#9E9E9E;width:100%;display:block;margin-bottom:4px;">TUKAR STATUS:</span>
            <button class="btn-status" onclick="updateStatus('Baharu')">🆕 Baharu</button>
            <button class="btn-status" onclick="updateStatus('Diproses')">⚙️ Diproses</button>
            <button class="btn-status" onclick="updateStatus('Dihantar')">🚚 Dihantar</button>
            <button class="btn-status" onclick="updateStatus('Selesai')">✅ Selesai</button>
        </div>
    `;

    document.getElementById('order-modal').classList.add('open');
}

function closeModal(event) {
    if (event.target === document.getElementById('order-modal')) {
        document.getElementById('order-modal').classList.remove('open');
    }
}

function copyOrderDetail() {
    if (!currentOrder) return;
    const text = buildInvoiceText(currentOrder);
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Detail invois disalin!');
    });
}

function waOrderDetail() {
    if (!currentOrder) return;
    const o = currentOrder;
    const phone = (o.telefon || '').replace(/[^0-9]/g, '');
    const waNum = phone.startsWith('0') ? '6' + phone : phone;
    const msg = `Assalamualaikum ${o.nama},%0A%0ATerima kasih atas pesanan anda di Hasnura Shop!%0A%0APesanan: ${o.pesanan}%0AJumlah: ${o.jumlah}%0A%0ASila maklumkan jenis penghantaran (COD/Postage) dan kami akan kemaskini kos sewajarnya.%0A%0ATerima kasih! 🙏`;
    window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
}

// ── UPDATE STATUS ─────────────────────────────────────
function updateStatus(newStatus) {
    if (!currentOrder) return;
    currentOrder.status = newStatus;

    // Update in Google Sheets via GAS
    fetch(CONFIG.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'updateStatus',
            id: currentOrder.id,
            status: newStatus
        })
    }).catch(e => console.warn(e));

    // Update locally
    const idx = allOrders.findIndex(o => o.id === currentOrder.id);
    if (idx > -1) allOrders[idx].status = newStatus;
    renderOrders(allOrders);
    updateStats(allOrders);
    document.getElementById('order-modal').classList.remove('open');
    showToast(`✅ Status dikemaskini: ${newStatus}`);
}

// ── TAB NAV ───────────────────────────────────────────
function showTab(tab) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

// ── INIT ─────────────────────────────────────────────
document.getElementById('admin-pw').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginAdmin();
});