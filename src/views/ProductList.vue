<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import { basic_url } from '@/config'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

const products = ref<Product[]>([])

onMounted(async () => {
  const res = await fetch(`${basic_url}/products`)
  products.value = await res.json()
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
    />
  </div>
</template>

<style scoped>
.product-list {
  display: flex;
  flex-wrap: wrap;
  margin-top: 60px; /* 預留空間避免被 navbar 蓋住 */
}
</style>