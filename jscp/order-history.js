/**
 * Lịch sử đơn hàng: GET /api/products/user/{uid}?type=...
 * Authorization: Bearer {Firebase token}
 */
(function () {
    var ORDER_HISTORY_API = 'https://api.deargift.online/api/products/user';
    var ORDER_HISTORY_TYPE = 'Birthday'; // Đổi theo type backend hỗ trợ: valentinepro | valentine | birthday | ...
    var HEART_QR_BASE = 'https://deargift.online/heartqr.html';

    function t(key) {
        if (typeof window !== 'undefined' && typeof window.t === 'function') return window.t(key);
        return key;
    }

    function getPaymentUrl(order) {
        return order.paymentUrl || order.checkoutUrl || order.linkqr || order.linkQr || '';
    }

    function getProductLink(order) {
        return order.linkproduct || order.linkProduct || '';
    }

    function openOrderHistoryModal() {
        var modal = document.getElementById('orderHistoryModal');
        var content = document.getElementById('orderHistoryContent');
        if (!modal || !content) return;
        modal.style.display = 'flex';
        content.innerHTML = '<div class="order-history-spinner" style="text-align:center;padding:24px;color:#5f6368;">' + (t('orderHistoryLoading') || 'Đang tải...') + '</div>';
        loadOrderHistory(content);
    }

    function closeOrderHistoryModal() {
        var modal = document.getElementById('orderHistoryModal');
        if (modal) modal.style.display = 'none';
    }

    function loadOrderHistory(contentEl) {
        var uid = typeof localStorage !== 'undefined' && localStorage.getItem('user_uid');
        if (!uid) {
            contentEl.innerHTML = '<p style="color:#5f6368;text-align:center;">' + (t('needLogin') || 'Bạn cần đăng nhập.') + '</p>';
            return;
        }
        var token = typeof localStorage !== 'undefined' && localStorage.getItem('token');
        if (!token) {
            contentEl.innerHTML = '<p style="color:#5f6368;text-align:center;">' + (t('needLogin') || 'Bạn cần đăng nhập.') + '</p>';
            return;
        }
        var url = ORDER_HISTORY_API + '/' + encodeURIComponent(uid) + '?type=' + encodeURIComponent(ORDER_HISTORY_TYPE);
        fetch(url, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success && Array.isArray(data.data)) {
                renderOrderList(contentEl, data.data);
            } else {
                contentEl.innerHTML = '<p style="color:#5f6368;text-align:center;">' + (t('orderHistoryEmpty') || 'Chưa có đơn hàng.') + '</p>';
            }
        })
        .catch(function (err) {
            console.error('Order history error:', err);
            contentEl.innerHTML = '<p style="color:#c5221f;text-align:center;">' + (t('orderHistoryError') || 'Không tải được lịch sử đơn.') + '</p>';
        });
    }

    function statusBadge(status) {
        var s = (status || '').toUpperCase();
        var label = s === 'FREE' ? (t('orderStatusFree') || 'Miễn phí') : s === 'PENDING' ? (t('orderStatusPending') || 'Chờ thanh toán') : (t('orderStatusPaid') || 'Đã thanh toán');
        var color = s === 'FREE' ? '#0d652d' : s === 'PENDING' ? '#b45300' : '#1a73e8';
        return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;background:' + color + ';color:#fff;">' + label + '</span>';
    }

    function formatDate(createdAt) {
        if (!createdAt) return '';
        var d = new Date(createdAt);
        return isNaN(d.getTime()) ? createdAt : d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    function createQRCode(link) {
        if (!link) return;
        window.open(HEART_QR_BASE + '?link=' + encodeURIComponent(link), '_blank');
    }

    function copyToClipboard(text, btn) {
        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                if (btn) { btn.textContent = (t('copied') || 'Đã copy!'); setTimeout(function () { btn.textContent = (t('copyLink') || 'Copy link'); }, 1500); }
            });
        } else {
            if (btn) btn.textContent = (t('copied') || 'Đã copy!');
        }
    }

    function renderOrderList(contentEl, orders) {
        if (!orders.length) {
            contentEl.innerHTML = '<p style="color:#5f6368;text-align:center;">' + (t('orderHistoryEmpty') || 'Chưa có đơn hàng.') + '</p>';
            return;
        }
        var html = '';
        orders.forEach(function (order) {
            var status = order.status || '';
            var paymentUrl = getPaymentUrl(order);
            var productLink = getProductLink(order);
            var name = order.name || ('Đơn #' + (order.orderCode || ''));
            var price = order.price != null ? (typeof order.price === 'number' ? order.price.toLocaleString('vi-VN') + ' đ' : order.price) : '';
            html += '<div class="order-item" style="border:1px solid #e8eaed;border-radius:10px;padding:12px;margin-bottom:10px;">';
            html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:8px;">';
            html += '<strong style="font-size:14px;">' + (name.replace(/</g, '&lt;')) + '</strong> ' + statusBadge(status) + '</div>';
            html += '<div style="font-size:12px;color:#5f6368;margin-bottom:8px;">';
            if (price) html += '<span>Giá: ' + price + '</span> · ';
            html += '<span>Mã: ' + (order.orderCode || '') + '</span> · ';
            html += '<span>' + formatDate(order.createdAt) + '</span></div>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
            if (status.toUpperCase() === 'PENDING' && paymentUrl) {
                html += '<button type="button" class="order-action-btn" data-action="pay" data-url="' + (paymentUrl.replace(/"/g, '&quot;')) + '" style="padding:6px 10px;border-radius:6px;border:1px solid #1a73e8;background:#1a73e8;color:#fff;font-size:12px;cursor:pointer;">' + (t('orderPay') || 'Thanh toán') + '</button>';
                html += '<button type="button" class="order-action-btn" data-action="copy-code" data-text="' + (String(order.orderCode || '').replace(/"/g, '&quot;')) + '" style="padding:6px 10px;border-radius:6px;border:1px solid #dadce0;background:#fff;font-size:12px;cursor:pointer;">' + (t('orderCopyCode') || 'Copy mã') + '</button>';
            }
            if (status.toUpperCase() === 'PAID' || status.toUpperCase() === 'FREE') {
                if (productLink) {
                    html += '<button type="button" class="order-action-btn" data-action="view" data-url="' + (productLink.replace(/"/g, '&quot;')) + '" style="padding:6px 10px;border-radius:6px;border:1px solid #1a73e8;background:#fff;color:#1a73e8;font-size:12px;cursor:pointer;">' + (t('viewWebsite') || 'Xem') + '</button>';
                    html += '<button type="button" class="order-action-btn copy-link-btn" data-action="copy-link" data-text="' + (productLink.replace(/"/g, '&quot;')) + '" style="padding:6px 10px;border-radius:6px;border:1px solid #dadce0;background:#fff;font-size:12px;cursor:pointer;">' + (t('copyLink') || 'Copy link') + '</button>';
                    html += '<button type="button" class="order-action-btn" data-action="heart-qr" data-url="' + (productLink.replace(/"/g, '&quot;')) + '" style="padding:6px 10px;border-radius:6px;border:1px solid #ea4335;background:#fff;color:#ea4335;font-size:12px;cursor:pointer;">❤️ ' + (t('heartQr') || 'Tạo QR Trái Tim') + '</button>';
                }
            }
            html += '</div></div>';
        });
        contentEl.innerHTML = html;
        contentEl.querySelectorAll('.order-action-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = this.getAttribute('data-action');
                var url = this.getAttribute('data-url');
                var text = this.getAttribute('data-text');
                if (action === 'pay' && url) window.open(url, '_blank');
                if (action === 'view' && url) window.open(url, '_blank');
                if (action === 'copy-code' || action === 'copy-link') copyToClipboard(text || '', this);
                if (action === 'heart-qr' && url) createQRCode(url);
            });
        });
    }

    var btn = document.getElementById('btnOrderHistory');
    if (btn) btn.addEventListener('click', openOrderHistoryModal);
    var closeBtn = document.getElementById('orderHistoryModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeOrderHistoryModal);
    var modal = document.getElementById('orderHistoryModal');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeOrderHistoryModal(); });
})();
