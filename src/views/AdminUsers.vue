<template>
  <div class="admin-users">
    <h2>用戶管理</h2>
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <table v-if="users.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.role }}</td>
            <td>
              <button @click="blockUser(u.id)">封鎖</button>
              <button @click="unblockUser(u.id)">解鎖</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else>目前沒有用戶</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { basic_url } from '@/config';

interface User {
  id: number;
  email: string;
  role: string;
}

const router = useRouter();
const users = ref<User[]>([]);
const loading = ref(true);
const errorMsg = ref('');

const fetchUsers = async () => {
  loading.value = true;
  errorMsg.value = '';
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    const res = await axios.get(`${basic_url}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    users.value = res.data;
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

const blockUser = async (id: number) => {
  if (!confirm('確定要封鎖此用戶嗎？')) return;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/users/${id}/block`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('用戶已被封鎖');
    fetchUsers();
  } catch (e) {
    alert('封鎖失敗');
  }
};

const unblockUser = async (id: number) => {
  if (!confirm('確定要解鎖此用戶嗎？')) return;
  try {
    const token = localStorage.getItem('admin_token');
    await axios.put(`${basic_url}/admin/users/${id}/unblock`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('用戶已被解鎖');
    fetchUsers();
  } catch (e) {
    alert('解鎖失敗');
  }
};

onMounted(fetchUsers);
</script>

<style scoped>
.admin-users {
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
