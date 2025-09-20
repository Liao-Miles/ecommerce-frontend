<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { basic_url } from '@/config'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await fetch(`${basic_url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    if (!res.ok) {
      const err = await res.text()
      errorMsg.value = err || '登入失敗，請檢查帳號密碼'
      loading.value = false
      return
    }
    const data = await res.json()
    localStorage.setItem('token', data.token)
    if (data.userId) {
      localStorage.setItem('userId', data.userId)
    }
    // 登入成功導向商品頁
    router.push('/products')
  } catch (e) {
    errorMsg.value = '伺服器錯誤，請稍後再試'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <h2>會員登入</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
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
.login-container {
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