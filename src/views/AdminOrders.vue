<template>
  <div class="admin-orders">
    <h2>訂單管理</h2>
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <table v-if="orders.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>用戶</th>
            <th>金額</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td>{{ o.id }}</td>
            <td>{{ o.user?.email || '-' }}</td>
            <td>{{ o.totalAmount }}</td>
            <td>{{ o.status }}</td>
            <td>
              <button disabled>修改狀態</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else>目前沒有訂單</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { basic_url } from '@/config';

interface OrderUser {
  email: string;
}
interface Order {
  id: number;
  user?: OrderUser;
  totalAmount: number;
  status: string;
  // 可根據後端補充其他欄位
}

const router = useRouter();
const orders = ref<Order[]>([]);
const loading = ref(true);
const errorMsg = ref('');

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
    orders.value = res.data;
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

onMounted(fetchOrders);
</script>

<style scoped>
.admin-orders {
  max-width: 800px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px 10px;
  text-align: left;
}
.error {
  color: #d00;
  margin-bottom: 12px;
}
</style>
