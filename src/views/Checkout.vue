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
  function ensureSessionId() {
    // 僅在訪客情境建立 sessionId
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
      let params = ''
      if (userId) {
        params = `userId=${userId}`
      } else {
        const sessionId = ensureSessionId()
        params = `sessionId=${sessionId}`
      }
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
      const userIdRaw = getUserId()
      const userId = userIdRaw ? Number(userIdRaw) : undefined
      if (!userId) {
        errorMsg.value = '請先登入'
        return
      }

      const token = localStorage.getItem('token')
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // 步驟1：建立訂單
      const items = cartItems.value.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
      const checkoutRequest = {
        userId,
        items,
        shippingAddress: address.value,
        shippingName: recipient.value,
        shippingPhone: phone.value,
        shippingMethod: shippingMethod.value,
        shippingNote: note.value
      }

      const checkoutRes = await fetch(`${basic_url}/orders/checkout-cart`, {
        method: 'POST',
        headers,
        body: JSON.stringify(checkoutRequest)
      })
      if (!checkoutRes.ok) {
        throw new Error(await checkoutRes.text() || '結帳失敗')
      }
      const orderData = await checkoutRes.json()
      const orderId = orderData.id

      // 步驟2：建立付款記錄
      const paymentRequest = {
        orderId: orderId,
        method: paymentMethod.value
      }

      const paymentRes = await fetch(`${basic_url}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentRequest)
      })
      if (!paymentRes.ok) {
        throw new Error(await paymentRes.text() || '付款記錄建立失敗')
      }
      const paymentData = await paymentRes.json()

      // 步驟3：依付款方式決定後續流程
      if (paymentMethod.value === '貨到付款') {
        // 貨到付款已在 PaymentService 中處理完成，直接顯示成功訊息
        successMsg.value = `訂單建立成功！訂單編號：${orderId}，狀態：等待送達確認付款，金額：${total.value}`
        cartItems.value = []
        setTimeout(() => router.push('/'), 3000)
      } else {
        // 信用卡或第三方支付：使用後端生成的 merchantTradeNo 跳轉到綠界
        const merchantTradeNo = paymentData.merchantTradeNo

        if (!merchantTradeNo) {
          throw new Error('無法取得付款交易號')
        }

        // 呼叫 ecpay/checkout 取得 HTML form
        const formHeaders: any = { 'Content-Type': 'application/x-www-form-urlencoded' }
        if (token) formHeaders['Authorization'] = `Bearer ${token}`

        const formRes = await fetch(`${basic_url}/payments/ecpay/checkout`, {
          method: 'POST',
          headers: formHeaders,
          body: new URLSearchParams({
            merchantTradeNo: merchantTradeNo,
            itemName: '購物車商品'
          })
        })

        if (!formRes.ok) throw new Error(await formRes.text() || '付款失敗')
        const formHtml = await formRes.text()

        // 直接將後端回傳的 form 注入頁面並自動提交
        const div = document.createElement('div')
        div.innerHTML = formHtml
        document.body.appendChild(div)
        ;(document.forms[0] as HTMLFormElement).submit()
      }

    } catch (e: any) {
      errorMsg.value = e.message || '結帳失敗'
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
