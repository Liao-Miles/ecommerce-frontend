<script setup lang="ts">
import { ref } from 'vue'
import { basic_url } from '@/config'

const props = defineProps<{
  id: number
  name: string
  price: number
  stock: number
}>()

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function getUserId() {
  return localStorage.getItem('userId')
}
function getSessionId() {
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now()
    localStorage.setItem('sessionId', sessionId)
  }
  return sessionId
}

async function addToCart() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const userId = getUserId()
    const sessionId = getSessionId()
    const body: any = {
      productId: props.id,
      quantity: 1
    }
    if (userId) body.userId = userId
    else body.sessionId = sessionId
    const res = await fetch(`${basic_url}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error('加入購物車失敗')
    successMsg.value = '已加入購物車！'
  } catch (e: any) {
    errorMsg.value = e.message || '發生錯誤'
  } finally {
    loading.value = false
    setTimeout(() => { successMsg.value = '' }, 1500)
  }
}
</script>

<template>
  <div class="product-card">
    <h3>{{ name }}</h3>
    <p>價格：{{ price }}</p>
    <p>庫存：{{ stock }}</p>
    <button @click="addToCart" :disabled="loading || stock === 0">
      {{ loading ? '加入中...' : (stock === 0 ? '缺貨' : '加入購物車') }}
    </button>
    <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    <p v-if="successMsg" class="success">{{ successMsg }}</p>
  </div>
</template>

<style scoped>
.product-card {
  border: 1px solid #eee;
  padding: 16px;
  margin: 8px;
  border-radius: 8px;
}
.error {
  color: #d00;
  margin-top: 8px;
}
.success {
  color: #080;
  margin-top: 8px;
}
</style>