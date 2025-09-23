<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import { basic_url } from '@/config'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  imageUrl?: string
  categories?: { id: number; name: string }[]
}

interface Category {
  id: number
  name: string
  description?: string
}

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const errorMsg = ref('')

// 查詢相關狀態
const searchId = ref<number | null>(null)
const searchName = ref('')
const searchCategoryId = ref<number | null>(null)
const searching = ref(false)

const fetchProducts = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${basic_url}/products`)
    const data = await res.json()
    products.value = data.sort((a: Product, b: Product) => a.id - b.id)
  } catch (e: any) {
    errorMsg.value = '載入失敗'
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await fetch(`${basic_url}/categories`)
    let data = await res.json()
    // debug log
    console.log('前台載入的分類:', data)
    // 若回傳為 { data: [...] } 則自動取 data
    if (Array.isArray(data)) {
      categories.value = data
    } else if (data && Array.isArray(data.data)) {
      categories.value = data.data
    } else {
      categories.value = []
      console.warn('分類 API 回傳格式異常', data)
    }
  } catch (e) {
    console.error('載入分類失敗', e)
  }
}

const searchProducts = async () => {
  if (searching.value) return
  searching.value = true
  try {
    // 構建查詢參數
    const params: any = {}
    if (searchId.value !== null && searchId.value !== undefined && `${searchId.value}` !== '') params.id = Number(searchId.value)
    if (searchName.value) params.name = searchName.value
    if (searchCategoryId.value !== null && searchCategoryId.value !== undefined && `${searchCategoryId.value}` !== '') params.categoryId = Number(searchCategoryId.value)
    const url = new URL(`${basic_url}/products/search`)
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    const res = await fetch(url.toString())
    products.value = await res.json()
  } catch (e) {
    errorMsg.value = '查詢失敗'
  } finally {
    searching.value = false
  }
}

const resetSearch = () => {
  searchId.value = null
  searchName.value = ''
  searchCategoryId.value = null
  fetchProducts()
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<template>
  <div class="product-list-view">
    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
    <!-- 查詢區塊 -->
    <div class="search-bar">
      <input v-model="searchId" type="number" min="1" placeholder="商品ID" class="search-input" />
      <input v-model="searchName" type="text" placeholder="商品名稱" class="search-input" />
      <select v-model.number="searchCategoryId" class="search-select">
        <option value="">全部分類</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <button @click="searchProducts" :disabled="searching" class="search-btn">搜尋</button>
      <button @click="resetSearch" :disabled="searching" class="reset-btn">重置</button>
      <span v-if="searching" class="searching-text">搜尋中...</span>
    </div>
    <div class="product-list">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :id="product.id"
        :name="product.name"
        :price="product.price"
        :stock="product.stock"
        :image-url="product.imageUrl"
      />
    </div>
  </div>
</template>

<style scoped>
.product-list-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 0 0 0; /* navbar間距縮小一半 */
}
.error {
  color: #d32f2f;
  margin-bottom: 12px;
  text-align: center;
  font-weight: 500;
}
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(76,175,80,0.07);
  padding: 18px 24px 18px 24px; /* 內距縮小 */
  margin-bottom: 8px; /* 商品列表距離再縮小 */
  margin-top: 8px; /* 搜尋欄與navbar距離縮小 */
  justify-content: flex-start;
  border: 1.5px solid #b2dfdb;
}
.search-input, .search-select {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1.5px solid #b2dfdb;
  font-size: 15px;
  background: #fff;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-sizing: border-box;
  height: 40px; /* 強制固定高度，避免focus時因box-shadow或border變化導致高度變動 */
}

.search-input:focus, .search-select:focus {
  border-color: #4caf50; /* 只改顏色，不改厚度 */
  outline: none;
  box-shadow: 0 0 0 2px rgba(76,175,80,0.2); /* 額外的 focus 效果 */
}

.search-btn {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 22px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(76,175,80,0.08);
  transition: background 0.2s;
}
.search-btn:disabled {
  background: #b2dfdb;
  color: #fff;
  cursor: not-allowed;
}
.reset-btn {
  background: #fff;
  color: #4caf50;
  border: 1.2px solid #4caf50;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 2px;
  transition: background 0.2s, color 0.2s;
}
.reset-btn:hover {
  background: #e8f5e9;
  color: #388e3c;
}
.searching-text {
  color: #888;
  margin-left: 10px;
  font-size: 14px;
}
.product-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 28px;
  margin-top: 32px;
  justify-items: stretch;
  background: #e8f5e9;
  padding: 32px 18px 48px 18px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(76,175,80,0.08);
  border: 1.5px solid #b2dfdb;
}
@media (max-width: 1200px) {
  .product-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 800px) {
  .product-list {
    grid-template-columns: repeat(2, 1fr);
    padding: 18px 4px 32px 4px;
  }
  .search-bar {
    flex-wrap: wrap;
    padding: 18px 8px 12px 8px;
    gap: 10px;
  }
}
@media (max-width: 500px) {
  .product-list {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 8px 0 16px 0;
  }
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 2px 8px 2px;
  }
}
</style>