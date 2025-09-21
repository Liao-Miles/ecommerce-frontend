<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { basic_url } from '@/config';

const email = ref('');
const password = ref('');
const message = ref('');
const loading = ref(false);

const register = async () => {
  message.value = '';
  loading.value = true;
  try {
    const response = await axios.post(`${basic_url}/api/auth/register`, {
      email: email.value,
      password: password.value
    });
    message.value = response.data || '註冊成功';
    email.value = '';
    password.value = '';
  } catch (error: any) {
    if (error.response && error.response.data) {
      message.value = error.response.data;
    } else {
      message.value = '註冊失敗，請稍後再試';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-container">
    <h2>註冊帳號</h2>
    <form @submit.prevent="register">
      <div class="form-group">
        <label for="email">Email</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <div class="form-group">
        <label for="password">密碼</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <button type="submit" :disabled="loading">{{ loading ? '註冊中...' : '註冊' }}</button>
    </form>
    <div v-if="message" class="message">{{ message }}</div>
  </div>
</template>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
.form-group {
  margin-bottom: 16px;
}
label {
  display: block;
  margin-bottom: 6px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 10px;
  background: #42b983;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
button:disabled {
  background: #aaa;
  cursor: not-allowed;
}
.message {
  margin-top: 16px;
  color: #d32f2f;
  text-align: center;
}
</style>