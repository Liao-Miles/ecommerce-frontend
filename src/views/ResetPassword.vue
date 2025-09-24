<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { basic_url } from '@/config'

const route = useRoute()
const router = useRouter()
const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const errorMsg = ref('')
const loading = ref(false)
const tokenValid = ref(false)

onMounted(async () => {
  token.value = route.query.token as string || ''
  if (!token.value) {
    errorMsg.value = '無效的重設連結'
    return
  }
  // 檢查 token 是否有效
  try {
    const res = await fetch(`${basic_url}/api/auth/reset-password?token=${token.value}`)
    if (!res.ok) {
      errorMsg.value = await res.text() || 'Token 無效或已過期'
      return
    }
    tokenValid.value = true
  } catch {
    errorMsg.value = '伺服器錯誤'
  }
})

const handleSubmit = async () => {
  message.value = ''
  errorMsg.value = ''
  if (newPassword.value.length < 6) {
    errorMsg.value = '密碼至少需 6 碼'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '兩次密碼輸入不一致'
    return
  }
  loading.value = true
  try {
    const res = await fetch(`${basic_url}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value, newPassword: newPassword.value })
    })
    if (!res.ok) {
      errorMsg.value = await res.text() || '重設失敗'
      return
    }
    message.value = '密碼重設成功，請重新登入。'
    setTimeout(() => router.push('/login'), 2000)
  } catch {
    errorMsg.value = '伺服器錯誤'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="reset-container">
    <h2>重設密碼</h2>
    <template v-if="tokenValid">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="newPassword">新密碼</label>
          <input id="newPassword" v-model="newPassword" type="password" required minlength="6" />
        </div>
        <div class="form-group">
          <label for="confirmPassword">確認新密碼</label>
          <input id="confirmPassword" v-model="confirmPassword" type="password" required minlength="6" />
        </div>
        <button type="submit" :disabled="loading">{{ loading ? '送出中...' : '送出' }}</button>
        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </form>
    </template>
    <template v-else>
      <p class="error">{{ errorMsg }}</p>
    </template>
    <div class="back-link">
      <a href="#" @click.prevent="router.push('/login')">返回登入</a>
    </div>
  </div>
</template>

<style scoped>
.reset-container {
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
input[type="password"] {
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

