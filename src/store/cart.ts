import { defineStore } from 'pinia'
import { basic_url } from '@/config'

export interface CartItem {
  id: number
  productId: number
  productName: string
  price: number
  quantity: number
  subtotal: number
  imageUrl?: string
}

function getUserId() {
  return localStorage.getItem('userId')
}
function getExistingSessionId() {
  // 只讀取，不自動建立，避免登入後又冒出新的 sessionId 導致混用
  return localStorage.getItem('sessionId')
}

export const useCartStore = defineStore('cart', {
  state: (): { items: CartItem[]; isFetching: boolean } => ({
    items: [],
    isFetching: false
  }),
  actions: {
    async fetchCart() {
      // 防止併發重複請求
      if (this.isFetching) return
      try {
        this.isFetching = true
        const userId = getUserId()
        const sessionId = getExistingSessionId()
        let params = ''
        if (userId) {
          params = `userId=${userId}`
          // 已登入時移除殘留的 sessionId，避免之後被其他頁面誤用
          if (localStorage.getItem('sessionId')) {
            localStorage.removeItem('sessionId')
            console.log('fetchCart: userId 存在，已移除 localStorage.sessionId')
          }
        } else if (sessionId) {
          params = `sessionId=${sessionId}`
        } else {
          // 沒有 userId 也沒有 sessionId，不創建新的，直接顯示空車
          this.items = []
          return
        }
        console.log('fetchCart params:', params)
        const res = await fetch(`${basic_url}/cart?${params}`)
        if (!res.ok) throw new Error('無法取得購物車')
        this.items = await res.json()
      } catch (e) {
        this.items = []
      } finally {
        this.isFetching = false
      }
    },
    addToCart(product: CartItem) {
      this.items.push(product)
    },
    removeFromCart(index: number) {
      this.items.splice(index, 1)
    },
    clearCart() {
      this.items = []
    }
  }
})
