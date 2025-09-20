<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import { useRouter } from 'vue-router'
import { basic_url } from '@/config'

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
const successMsg = ref('')
const router = useRouter()

const recipient = ref('')
const address = ref('')
const paymentMethod = ref('信用卡')
const phone = ref('')
const note = ref('')
const shippingMethod = ref('home')

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

const total = computed(() => cartItems.value.reduce((sum, item) => sum + item.subtotal, 0))

async function handlePayment() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!recipient.value || !address.value || !phone.value) {
    errorMsg.value = '請填寫完整收件人、電話、地址'
    return
  }
  loading.value = true
  try {
    // 1. 組成 orderRequest
    const userIdRaw = getUserId()
    const userId = userIdRaw ? Number(userIdRaw) : undefined
    const token = localStorage.getItem('token')
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const orderRequest: any = {
      userId,
      totalAmount: total.value,
      shippingName: recipient.value,
      shippingPhone: phone.value,
      shippingAddress: address.value,
      shippingNote: note.value,
      shippingMethod: shippingMethod.value,
      items: cartItems.value.map(i => ({ productId: i.productId, quantity: i.quantity }))
    }
    // 2. 呼叫 /orders 建立訂單
    const orderRes = await fetch(`${basic_url}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderRequest)
    })
    if (!orderRes.ok) {
      const errText = await orderRes.text()
      throw new Error(errText || '建立訂單失敗')
    }
    const orderData = await orderRes.json()
    const orderId = orderData.id
    // 3. 組成 paymentRequest
    const paymentRequest = {
      orderId,
      method: paymentMethod.value
    }
    // 4. 呼叫 /payments 完成付款
    const payRes = await fetch(`${basic_url}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentRequest)
    })
    if (!payRes.ok) {
      const errText = await payRes.text()
      throw new Error(errText || '付款失敗')
    }
    const payData = await payRes.json()
    successMsg.value = `付款成功！訂單編號：${payData.id}，狀態：${payData.status}，金額：${payData.total_amount}`
    setTimeout(() => router.push('/'), 2000)
  } catch (e: any) {
    errorMsg.value = e.message || '付款失敗'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCart)
</script>

<template>
  <div class="checkout-container">
    <h2>結帳付款</h2>
    <div v-if="loading">處理中...</div>
    <div v-else>
      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="success">{{ successMsg }}</div>
      <table v-if="cartItems.length" class="cart-table">
        <thead>
          <tr>
            <th>商品名稱</th>
            <th>單價</th>
            <th>數量</th>
            <th>小計</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cartItems" :key="item.id">
            <td>{{ item.productName }}</td>
            <td>{{ item.price }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.subtotal }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">購物車是空的，無法結帳</div>
      <div v-if="cartItems.length" class="checkout-form">
        <div class="form-group">
          <label>收件人</label>
          <input v-model="recipient" type="text" required />
        </div>
        <div class="form-group">
          <label>地址</label>
          <input v-model="address" type="text" required />
        </div>
        <div class="form-group">
          <label>電話</label>
          <input v-model="phone" type="text" required />
        </div>
        <div class="form-group">
          <label>備註</label>
          <input v-model="note" type="text" />
        </div>
        <div class="form-group">
          <label>運送方式</label>
          <select v-model="shippingMethod">
            <option value="home">宅配到家</option>
            <option value="store">超商取貨</option>
          </select>
        </div>
        <div class="form-group">
          <label>付款方式</label>
          <select v-model="paymentMethod">
            <option value="信用卡">信用卡</option>
            <option value="貨到付款">貨到付款</option>
          </select>
        </div>
        <div class="total">總金額：{{ total }}</div>
        <button @click="handlePayment" :disabled="loading">{{ loading ? '付款中...' : '確認付款' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-container {
  max-width: 700px;
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
.checkout-form {
  margin-top: 24px;
}
.form-group {
  margin-bottom: 16px;
}
label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}
input, select {
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
.total {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
}
.error {
  color: #d00;
  margin-bottom: 10px;
  text-align: center;
}
.success {
  color: #080;
  margin-bottom: 10px;
  text-align: center;
}
.empty {
  text-align: center;
  color: #888;
  margin-top: 30px;
}
</style>
