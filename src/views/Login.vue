<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { basic_url } from '@/config'
import { useCartStore } from '@/store/cart'

// 宣告給 TypeScript 用，避免報錯
declare global {
  interface Window {
    google: any;
  }
}

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
    const sessionId = getSessionId()
    const res = await fetch(`${basic_url}/api/auth/login?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    if (!res.ok) {
      errorMsg.value = await res.text() || '登入失敗'
      loading.value = false
      return
    }
    const data = await res.json()
    localStorage.setItem('token', data.token)
    if (data.userId) {
      localStorage.setItem('userId', data.userId)
      await new Promise(resolve => setTimeout(resolve, 500))
      await cartStore.fetchCart()
      localStorage.removeItem('sessionId')
    }
    router.push('/products')
  } catch {
    errorMsg.value = '伺服器錯誤'
  } finally {
    loading.value = false
  }
}

// Google 登入 callback
function handleGoogleLogin(response: any) {
  loading.value = true
  fetch(`${basic_url}/api/auth/oauth2/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: response.credential })
  })
      .then(async res => {
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      })
      .then(async data => {
        localStorage.setItem('token', data.token)
        if (data.userId) {
          localStorage.setItem('userId', data.userId)
          await new Promise(resolve => setTimeout(resolve, 500))
          await cartStore.fetchCart()
        }
        router.push('/products')
      })
      .catch(e => {
        errorMsg.value = e.message || 'Google 登入失敗'
      })
      .finally(() => {
        loading.value = false
      })
}

onMounted(() => {
  const init = () => {
    if (window.google && window.google.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: '511398803371-lapa482s6npsp6tbiph4satd3b505fkh.apps.googleusercontent.com',
        callback: handleGoogleLogin
      })
      window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large' }
      )
    } else {
      setTimeout(init, 300)
    }
  }
  init()
})
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

    <!-- 忘記密碼連結 -->
    <div class="forgot-link">
      <a href="#" @click.prevent="router.push('/forgot-password')">忘記密碼？</a>
    </div>

    <!-- Google 登入按鈕 -->
    <div class="google-login">
      <div id="google-signin-btn"></div>
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
.forgot-link {
  margin-top: 10px;
  text-align: center;
  font-size: 15px;
}
.forgot-link a {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}
.google-login {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}
</style>
