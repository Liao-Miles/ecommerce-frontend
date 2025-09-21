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
}

const products = ref<Product[]>([])

onMounted(async () => {
  const res = await fetch(`${basic_url}/products`)
  const data = await res.json()
  // 依 id 排序，確保前端顯示順序穩定
  products.value = data.sort((a: Product, b: Product) => a.id - b.id)
})
</script>

<template>
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
</template>

<style scoped>
.product-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 28px;
  margin-top: 48px;
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
}
@media (max-width: 500px) {
  .product-list {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 8px 0 16px 0;
  }
}
</style>