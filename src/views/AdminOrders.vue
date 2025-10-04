<template>
  <div class="admin-orders">
    <AdminNav />
    <h2>訂單管理</h2>
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <table v-if="orders.length">
        <thead>
          <tr>
            <th style="width: 80px;cursor:pointer;" @click="sortBy('id')">
              ID
              <span v-if="sortKey==='id'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
            </th>
            <th style="width: 220px;">顧客</th>
            <th style="width: 120px;">金額</th>
            <th style="width: 180px;cursor:pointer;" @click="sortBy('createdAt')">
              建立時間
              <span v-if="sortKey==='createdAt'">{{ sortOrder==='asc'?'▲':'▼' }}</span>
            </th>
            <th style="width: 120px;">訂單狀態</th>
            <th style="width: 120px;">付款狀態</th>
            <th style="width: 160px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in sortedOrders" :key="o.id">
            <td>{{ o.id }}</td>
            <td>{{ getCustomerDisplay(o) }}</td>
            <td>{{ o.totalAmount }}</td>
            <td>{{ formatDateTime(o.createdAt) }}</td>
            <td>
              <span class="badge badge-status" :class="'status-' + (o.status || 'unknown')" :data-status="o.status || 'unknown'">
                {{ getStatusText(o.status) }}
              </span>
            </td>
            <td>
              <span class="badge" :style="'background:#888;'" v-if="updatingPaymentOrderId !== o.id">
                {{ paymentStatusText[o.paymentStatus] || o.paymentStatus }}
              </span>
              <select v-model="o.paymentStatus"
                      :disabled="updatingPaymentOrderId === o.id || !canEditStatus(o.status)"
                      @change="onPaymentStatusChange(o)"
                      class="status-select"
                      :data-order-id="o.id"
                      v-if="updatingPaymentOrderId !== o.id">
                <option v-for="s in paymentStatusOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
              </select>
              <span v-if="updatingPaymentOrderId === o.id" style="color:#888;font-size:13px;">更新中...</span>
            </td>
            <td>
              <button class="btn-detail" @click="showDetail(o)">查看詳情</button>
              <select v-model="o.status" :disabled="updatingOrderId === o.id || !canEditStatus(o.status)" @change="onStatusChange(o)" class="status-select" :data-order-id="o.id">
                <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.text }}</option>
              </select>
              <span v-if="updatingOrderId === o.id" style="color:#888;font-size:13px;">更新中...</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else>目前沒有訂單</div>
      <OrderDetailModal v-if="detailOrder" :order="detailOrder" :user-email="users[detailOrder.userId]" @close="detailOrder = null" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { basic_url, OrderStatus, PaymentStatus } from '@/config';
import OrderDetailModal from '@/components/OrderDetailModal.vue';
import AdminNav from '@/components/AdminNav.vue';

// 狀態選項，僅顯示訂單進度
const statusOptions = [
  { value: OrderStatus.CREATED, text: '已建立' },
  { value: OrderStatus.PROCESSING, text: '處理中' },
  { value: OrderStatus.SHIPPED, text: '已出貨' },
  { value: OrderStatus.COMPLETED, text: '已完成' },
  { value: OrderStatus.CANCELLED, text: '已取消' }
];

// 金流狀態顯示對應
const paymentStatusText: Record<string, string> = {
  [PaymentStatus.PENDING]: '待付款',
  [PaymentStatus.SUCCESS]: '付款成功',
  [PaymentStatus.FAILED]: '付款失敗',
  [PaymentStatus.REFUNDED]: '已退款',
};

const paymentStatusOptions = [
  { value: PaymentStatus.PENDING, text: '待付款' },
  { value: PaymentStatus.SUCCESS, text: '付款成功' },
  { value: PaymentStatus.FAILED, text: '付款失敗' },
  { value: PaymentStatus.REFUNDED, text: '已退款' },
];

interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus?: string;
  createdAt: string;
  shippingName?: string;
  // ...其他欄位可選
}

const router = useRouter();
const orders = ref<Order[]>([]);
const users = ref<{ [key: number]: string }>({});
const loading = ref(true);
const errorMsg = ref('');
const updatingOrderId = ref<number | null>(null);
const updatingPaymentOrderId = ref<number | null>(null);
const detailOrder = ref<any>(null);

const sortKey = ref<'id'|'createdAt'>('id');
const sortOrder = ref<'asc'|'desc'>('desc');

const fetchUsers = async () => {
  const token = localStorage.getItem('admin_token');
  if (!token) return;
  try {
    const res = await axios.get(`${basic_url}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = {};
    res.data.forEach((u: any) => {
      users.value[u.id] = u.email;
    });
  } catch (e) {
    // 忽略用戶查詢錯誤
  }
};

const fetchOrders = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    const res = await axios.get(`${basic_url}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // 確保每筆訂單都有 paymentStatus 欄位
    orders.value = res.data.map((o: any) => ({
      ...o,
      paymentStatus: o.paymentStatus || PaymentStatus.PENDING
    }));
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      router.push('/admin/login');
    } else {
      errorMsg.value = e.response?.data || '載入失敗';
    }
  } finally {
    loading.value = false;
  }
};

// 狀態是否可編輯（已完成/已取消不可再更改）
const canEditStatus = (status: string) => {
  return true;
};

// 狀態中文
const getStatusText = (status: string) => {
  switch (status) {
    case OrderStatus.CREATED: return '已建立';
    case OrderStatus.PROCESSING: return '處理中';
    case OrderStatus.SHIPPED: return '已出貨';
    case OrderStatus.COMPLETED: return '已完成';
    case OrderStatus.CANCELLED: return '已取消';
    default: return status;
  }
};

// 顯示顧客姓名和email縮寫
const getCustomerDisplay = (order: Order) => {
  const email = users.value[order.userId] || '';
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
};

// 狀態切換事件
const onStatusChange = async (order: Order) => {
  if (!canEditStatus(order.status)) return;
  const oldStatus = orders.value.find(o => o.id === order.id)?.status;
  if (!confirm(`確定要將訂單狀態變更為「${getStatusText(order.status)}」嗎？`)) {
    // 取消後恢復原本狀態
    if (oldStatus) order.status = oldStatus;
    return;
  }
  updatingOrderId.value = order.id;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/orders/${order.id}/status`, { status: order.status }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    // 只更新該筆訂單狀態，不刷新整個 orders 陣列，避免排序跳動
    const idx = orders.value.findIndex(o => o.id === order.id);
    if (idx !== -1) orders.value[idx].status = order.status;
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      alert('權限不足，請重新登入管理員帳號');
      router.push('/admin/login');
    } else if (e.response && e.response.status === 404) {
      alert('訂單不存在');
    } else if (e.response && e.response.status === 400) {
      alert('請求格式錯誤');
    } else {
      alert('狀態更新失敗，請稍後再試');
    }
    // 失敗時恢復原本狀態
    if (oldStatus) order.status = oldStatus;
  } finally {
    updatingOrderId.value = null;
  }
};

// 付款狀態切換事件
const onPaymentStatusChange = async (order: Order) => {
  const oldStatus = orders.value.find(o => o.id === order.id)?.paymentStatus;
  if (!confirm(`確定要將付款狀態變更為「${paymentStatusText[order.paymentStatus] || order.paymentStatus}」嗎？`)) {
    if (oldStatus) order.paymentStatus = oldStatus;
    return;
  }
  updatingPaymentOrderId.value = order.id;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/orders/${order.id}/payment-status`, { status: order.paymentStatus }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const idx = orders.value.findIndex(o => o.id === order.id);
    if (idx !== -1) orders.value[idx].paymentStatus = order.paymentStatus;
  } catch (e: any) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      alert('權限不足，請重新登入管理員帳號');
      router.push('/admin/login');
    } else if (e.response && e.response.status === 404) {
      alert('訂單不存在');
    } else if (e.response && e.response.status === 400) {
      alert('請求格式錯誤');
    } else {
      alert('付款狀態更新失敗，請稍後再試');
    }
    if (oldStatus) order.paymentStatus = oldStatus;
  } finally {
    updatingPaymentOrderId.value = null;
  }
};

const showDetail = (order: any) => {
  detailOrder.value = order;
};

const sortBy = (key: 'id'|'createdAt') => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'desc';
  }
};

const sortedOrders = computed(() => {
  const arr = [...orders.value];
  arr.sort((a, b) => {
    let v1 = a[sortKey.value];
    let v2 = b[sortKey.value];
    if (sortKey.value === 'createdAt') {
      v1 = v1 ? new Date(v1).getTime() : 0;
      v2 = v2 ? new Date(v2).getTime() : 0;
    }
    if (sortOrder.value === 'asc') {
      return v1 > v2 ? 1 : v1 < v2 ? -1 : 0;
    } else {
      return v1 < v2 ? 1 : v1 > v2 ? -1 : 0;
    }
  });
  return arr;
});

function formatDateTime(dt: string) {
  if (!dt) return '-';
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchUsers()]);
});
</script>

<style scoped>
.admin-orders {
  max-width: 900px;
  margin: 40px auto;
  padding: 32px 32px 32px 32px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
}
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 24px;
  table-layout: fixed;
}
th, td {
  border: 1px solid #ccc;
  padding: 14px 16px;
  text-align: left;
  word-break: break-all;
  font-size: 16px;
}
th {
  background: #f5f7fa;
  font-weight: 600;
}
tr:nth-child(even) {
  background: #fafbfc;
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}
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
.btn-detail {
  background: #fff;
  border: 1px solid #3498db;
  color: #3498db;
  border-radius: 6px;
  padding: 4px 10px;
  margin-right: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}
.btn-detail:hover {
  background: #3498db;
  color: #fff;
}
.status-select {
  margin-left: 0;
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b2dfdb;
  background: #f8f8f8;
  font-size: 15px;
}
.error {
  color: #d00;
  margin-bottom: 12px;
}
</style>
