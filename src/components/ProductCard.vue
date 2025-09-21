<script setup lang="ts">
import { ref } from 'vue'
import { basic_url } from '@/config'

const props = defineProps<{
  id: number
  name: string
  price: number
  stock: number
  imageUrl?: string
}>()

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

function getUserId() {
  return localStorage.getItem('userId')
}
function ensureSessionId() {
  // 僅供訪客加入購物車時建立
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
    const body: any = {
      productId: props.id,
      quantity: 1
    }
    if (userId) {
      body.userId = userId
    } else {
      const sessionId = ensureSessionId()
      body.sessionId = sessionId
    }
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
    <div class="image-wrap">
      <img v-if="props.imageUrl" :src="props.imageUrl" alt="商品圖片" class="product-img" />
      <div v-else class="no-image">無圖片</div>
    </div>
    <div class="info">
      <h3>{{ props.name }}</h3>
      <div>價格：{{ props.price }}</div>
      <div>庫存：{{ props.stock }}</div>
      <button @click="addToCart" :disabled="loading || props.stock <= 0">
        {{ props.stock > 0 ? (loading ? '加入中...' : '加入購物車') : '缺貨' }}
      </button>
      <div v-if="successMsg" class="success">{{ successMsg }}</div>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  border: 1.5px solid #b2dfdb;
  border-radius: 10px;
  background: #f1f8e9;
  padding: 18px 10px 16px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(76,175,80,0.08);
  transition: box-shadow 0.2s;
}
.product-card:hover {
  box-shadow: 0 4px 18px rgba(56,142,60,0.13);
}
.image-wrap {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: #e8f5e9;
  border-radius: 8px;
  border: 1px solid #b2dfdb;
}
.product-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #a5d6a7;
  background: #fff;
}
.no-image {
  width: 100%;
  height: 100%;
  background: #c8e6c9;
  color: #388e3c;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
}
.info {
  width: 100%;
  text-align: center;
}
.info h3 {
  color: #388e3c;
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 1px;
}
.info div {
  color: #388e3c;
  font-size: 15px;
  margin-bottom: 4px;
}
button {
  background: linear-gradient(90deg, #43a047 0%, #66bb6a 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 7px 18px;
  font-size: 15px;
  margin-top: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #388e3c;
}
button:disabled {
  background: #bdbdbd;
  color: #eee;
  cursor: not-allowed;
}
.success {
  color: #43a047;
  margin-top: 8px;
  font-weight: 500;
}
.error {
  color: #d32f2f;
  margin-top: 8px;
  font-weight: 500;
}
</style>