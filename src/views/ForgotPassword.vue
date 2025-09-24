<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { basic_url } from '@/config'

const email = ref('')
const message = ref('')
const errorMsg = ref('')
const loading = ref(false)
const router = useRouter()

const handleSubmit = async () => {
  message.value = ''
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await fetch(`${basic_url}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    if (!res.ok) {
      errorMsg.value = await res.text() || '申請失敗'
      return
    }
    message.value = '已寄送重設密碼連結，請至信箱查收。'
  } catch {
    errorMsg.value = '伺服器錯誤'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="forgot-container">
    <h2>找回密碼</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">請輸入註冊信箱</label>
        <input id="email" v-model="email" type="email" required />
      </div>
      <button type="submit" :disabled="loading">{{ loading ? '送出中...' : '送出' }}</button>
      <p v-if="message" class="success">{{ message }}</p>
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </form>
    <div class="back-link">
      <a href="#" @click.prevent="router.push('/login')">返回登入</a>
    </div>
  </div>
</template>

<style scoped>
.forgot-container {
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
input[type="email"] {
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
.success {
  color: #42b983;
  margin-top: 10px;
  text-align: center;
}
.error {
  color: #d00;
  margin-top: 10px;
  text-align: center;
}
.back-link {
  margin-top: 18px;
  text-align: center;
  font-size: 15px;
}
.back-link a {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}
</style>

