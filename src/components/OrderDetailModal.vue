<template>
  <div class="modal-mask" @click.self="close">
    <div class="modal-container">
      <h3>訂單詳情</h3>
      <div class="detail-grid">
        <div class="detail-cell"><b>訂單ID：</b>{{ order.id }}</div>
        <div class="detail-cell"><b>訂單成立時間：</b>{{ formatDateTime(order.createdAt) }}</div>
        <div class="detail-cell"><b>用戶：</b>{{ getCustomerDisplay(order) }}</div>
        <div class="detail-cell"><b>金額：</b>{{ order.totalAmount }}</div>
        <div class="detail-cell"><b>訂單狀態：</b>
          <span class="badge badge-status" :class="'status-' + (order.status || 'unknown')">
            {{ getStatusText(order.status) }}
          </span>
        </div>
        <div class="detail-cell"><b>配送狀態：</b>
          <span class="badge badge-shipping" :class="'shipping-' + (order.shippingStatus || 'unknown')">
            {{ order.shippingStatus || '-' }}
          </span>
        </div>
        <div class="detail-cell"><b>收件人：</b>{{ order.shippingName }}</div>
        <div class="detail-cell"><b>電話：</b>{{ order.shippingPhone }}</div>
        <div class="detail-cell"><b>地址：</b>{{ order.shippingAddress }}</div>
        <div class="detail-cell"><b>備註：</b>{{ order.shippingNote }}</div>
        <div class="detail-cell"><b>配送方式：</b>{{ getShippingMethodText(order.shippingMethod) }}</div>
      </div>
      <h3 class="items-title">商品明細</h3>
      <div class="items-table-wrapper">
        <table v-if="order.items && order.items.length" class="items-table">
          <thead>
            <tr>
              <th>商品名稱</th>
              <th>數量</th>
              <th>單價</th>
              <th>小計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id">
              <td>{{ item.productName }}</td>
              <td>{{ item.quantity }}</td>
              <td>￥{{ item.price.toLocaleString() }}</td>
              <td>￥{{ item.subtotal.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-items">無商品明細</div>
      </div>
      <button class="btn-close" @click="close">關閉</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ order: any; userEmail?: string }>();
const emit = defineEmits(['close']);
const close = () => emit('close');

function formatDateTime(dt: string) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function getStatusText(status: string) {
  switch (status) {
    case 'PENDING_PAYMENT': return '待付款';
    case 'PAID': return '已付款';
    case 'CONFIRMED': return '已確認';
    case 'SHIPPED': return '已出貨';
    case 'COMPLETED': return '已完成';
    case 'CANCELLED': return '已取消';
    default: return status;
  }
}

function getCustomerDisplay(order: any): string {
  const email = props.userEmail || order.userEmail || order.userId + '';
  const name = order.shippingName || '';
  let emailShort = email;
  const atIdx = email.indexOf('@');
  if (atIdx > 2) {
    emailShort = email.substring(0, 3) + '**' + email.substring(atIdx);
  } else if (atIdx > 0) {
    emailShort = email[0] + '**' + email.substring(atIdx);
  }
  if (name) {
    return `${name} (${emailShort})`;
  } else {
    return emailShort;
  }
}

function getShippingMethodText(method: string) {
  if (method === 'home') return '宅配到家';
  if (method === 'store') return '超商取貨';
  return method || '-';
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9999;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-container {
  background: #fff;
  border-radius: 14px;
  padding: 36px 40px 28px 40px;
  min-width: 360px;
  max-width: 96vw;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  font-size: 17px;
  line-height: 1.7;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 32px;
  margin-bottom: 18px;
}
.detail-cell {
  font-size: 17px;
  display: flex;
  align-items: flex-start;
  min-width: 0;
  word-break: break-all;
}
.detail-cell b {
  min-width: 90px;
  display: inline-block;
  color: #2d3a4a;
}
.items-title {
  margin-top: 28px;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #2d3a4a;
  display: block;
}
.items-table-wrapper {
  max-height: 320px;
  overflow-y: auto;
  margin-bottom: 10px;
  border-radius: 8px;
  background: #f8fafc;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.items-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  display: table;
}
.items-table th, .items-table td {
  border: 1px solid #e0e0e0;
  padding: 10px 14px;
  text-align: left;
  font-size: 15px;
}
.items-table th {
  background: #f0f4f8;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}
.items-table tr:nth-child(even) {
  background: #f9fbfd;
}
.no-items {
  color: #888;
  font-size: 15px;
  margin: 12px 0 0 0;
  display: block;
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-left: 4px;
}
.badge-shipping.shipping-pending { background: #f39c12; }
.badge-shipping.shipping-shipped { background: #3498db; }
.badge-shipping.shipping-delivered { background: #27ae60; }
.badge-shipping.shipping-cancelled { background: #e74c3c; }
.badge-shipping.shipping-unknown { background: #b2bec3; }
.badge-status {
  color: #111 !important;
  font-weight: bold;
  background: #e0e0e0;
  border-radius: 12px;
  border: none;
}
.badge-status.status-CREATED { background: #ffe082; }
.badge-status.status-PROCESSING { background: #b3e5fc; }
.badge-status.status-SHIPPED { background: #c8e6c9; }
.badge-status.status-COMPLETED { background: #fff9c4; }
.badge-status.status-CANCELLED { background: #ffcdd2; }
.badge-status.status-unknown { background: #e0e0e0; }
.btn-close {
  margin-top: 24px;
  padding: 8px 28px;
  border-radius: 8px;
  border: 1.5px solid #3498db;
  background: #fff;
  color: #3498db;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  font-weight: 500;
}
.btn-close:hover {
  background: #3498db;
  color: #fff;
}
</style>
