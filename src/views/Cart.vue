<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { basic_url } from '@/config'
import { useRouter } from 'vue-router'

interface CartItem {
  id: number
  productId: number
  productName: string
  price: number
  quantity: number
  subtotal: number
}

const cartItems = ref<CartItem[]>([])
const loading = ref(false)
const errorMsg = ref('')
const isLoggedIn = ref(false)

const router = useRouter()

function getUserId() {
  // 假設登入時 userId 存在 localStorage
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

async function fetchCart() {
  loading.value = true
  errorMsg.value = ''
  try {
    const userId = getUserId()
    const sessionId = getSessionId()
    const params = userId ? `userId=${userId}` : `sessionId=${sessionId}`
    const res = await fetch(`${basic_url}/cart?${params}`)
    if (!res.ok) throw new Error('無法取得購物車')
    cartItems.value = await res.json()
  } catch (e: any) {
    errorMsg.value = e.message || '發生錯誤'
  } finally {
    loading.value = false
  }
}

async function removeItem(id: number) {
  if (!confirm('確定要刪除這項商品嗎？')) return
  loading.value = true
  try {
    const res = await fetch(`${basic_url}/cart/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('刪除失敗')
    await fetchCart()
  } catch (e: any) {
    errorMsg.value = e.message || '發生錯誤'
  } finally {
    loading.value = false
  }
}

function goCheckout() {
  router.push('/checkout')
}

onMounted(() => {
  fetchCart()
  isLoggedIn.value = !!getUserId()
})
</script>

<template>
  <div class="cart-container">
    <h2>購物車</h2>
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <table v-if="cartItems.length" class="cart-table">
        <thead>
          <tr>
            <th>商品名稱</th>
            <th>單價</th>
            <th>數量</th>
            <th>小計</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cartItems" :key="item.id">
            <td>{{ item.productName }}</td>
            <td>{{ item.price }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.subtotal }}</td>
            <td><button @click="removeItem(item.id)">刪除</button></td>
          </tr>
        </tbody>
      </table>
      <button
        v-if="cartItems.length"
        class="checkout-btn"
        @click="goCheckout"
        :disabled="!isLoggedIn"
        title="請先登入才能結帳"
      >
        前往結帳
      </button>
      <div v-if="cartItems.length && !isLoggedIn" class="login-tip">請先登入才能結帳</div>
      <div v-if="!cartItems.length" class="empty">購物車是空的</div>
    </div>
  </div>
</template>

<style scoped>
.cart-container {
  max-width: 800px;
  margin: 80px auto 0 auto;
  padding: 32px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.cart-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}
.cart-table th, .cart-table td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: center;
}
.cart-table th {
  background: #f8f8f8;
}
button {
  background: #d00;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
}
button:disabled {
  background: #aaa;
  cursor: not-allowed;
}
.error {
  color: #d00;
  margin-bottom: 10px;
  text-align: center;
}
.empty {
  text-align: center;
  color: #888;
  margin-top: 30px;
}
.checkout-btn {
  margin-top: 24px;
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.checkout-btn:hover {
  background: #0056b3;
}
</style>