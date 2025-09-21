<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { basic_url } from '@/config';

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);
const router = useRouter();

const login = async () => {
  errorMsg.value = '';
  loading.value = true;
  try {
    const res = await axios.post(`${basic_url}/admin/login`, {
      email: email.value,
      password: password.value
    });
    if (res.data && res.data.token) {
      localStorage.setItem('admin_token', res.data.token);
      router.push('/admin/dashboard');
    } else {
      errorMsg.value = '登入失敗';
    }
  } catch (e: any) {
    errorMsg.value = e.response?.data || '登入失敗';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="admin-login-container">
    <h2>管理員登入</h2>
    <form @submit.prevent="login">
      <div class="form-group">
        <label for="email">帳號</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <div class="form-group">
        <label for="password">密碼</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <button type="submit" :disabled="loading">{{ loading ? '登入中...' : '登入' }}</button>
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </form>
  </div>
</template>

<style scoped>
.admin-login-container {
  max-width: 350px;
  margin: 80px auto 0 auto;
  padding: 32px 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.form-group {
  margin-bottom: 18px;
}
label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
input[type="email"], input[type="password"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}
button {
  width: 100%;
  padding: 10px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
button:disabled {
  background: #888;
  cursor: not-allowed;
}
.error {
  color: #d00;
  margin-top: 10px;
  text-align: center;
}
</style>
