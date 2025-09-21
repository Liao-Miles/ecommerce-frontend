<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { basic_url } from '@/config'
import { useCartStore } from '@/store/cart'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()
const cartStore = useCartStore()

function getSessionId() {
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now()
    localStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    // 登入前 log sessionId
    console.log('Before login, localStorage.sessionId:', localStorage.getItem('sessionId'))
    const sessionId = getSessionId()
    console.log('Login API will send sessionId:', sessionId)
    const res = await fetch(`${basic_url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value, sessionId })
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
      console.log('After login, set localStorage.userId:', data.userId)
      localStorage.removeItem('sessionId') // 登入後移除 sessionId
      console.log('After login, removed localStorage.sessionId')
    }
    // 臨時延遲，驗證後端合併購物車時序
    await new Promise(res => setTimeout(res, 300));
    // 登入成功後重新取得購物車
    await cartStore.fetchCart()
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
    <div class="register-link">
      還沒有帳號？
      <a href="#" @click.prevent="router.push('/register')">註冊帳號</a>
    </div>
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
.register-link {
  margin-top: 18px;
  text-align: center;
  font-size: 15px;
}
.register-link a {
  color: #42b983;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 4px;
}
</style>