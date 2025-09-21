<template>
  <nav class="admin-sidebar">
    <router-link to="/admin/users" :class="{active: isActive('/admin/users')}">
      <span class="icon">👤</span> 用戶管理
    </router-link>
    <router-link to="/admin/products" :class="{active: isActive('/admin/products')}">
      <span class="icon">📦</span> 商品管理
    </router-link>
    <router-link to="/admin/orders" :class="{active: isActive('/admin/orders')}">
      <span class="icon">🧾</span> 訂單管理
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const isActive = (path: string) => route.path.startsWith(path);
</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  top: 100px; /* 預留 navbar 高度，根據實際 navbar 高度調整 */
  left: 50px;
  height: calc(90vh - 100px); /* 減去 navbar 高度 */
  width: 200px;
  background: #e8f5e9;
  border-right: 1.5px solid #b2dfdb;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding-top: 24px;
  z-index: 90; /* 比 navbar 低，避免蓋住 navbar */
  box-shadow: 2px 0 8px rgba(56,142,60,0.04);
}
.admin-sidebar a {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #388e3c;
  font-weight: 600;
  text-decoration: none;
  font-size: 18px;
  padding: 16px 24px;
  border-radius: 0 24px 24px 0;
  margin-bottom: 8px;
  transition: background 0.2s, color 0.2s;
}
.admin-sidebar a.active {
  background: #a5d6a7;
  color: #1b5e20;
}
.admin-sidebar a:hover {
  background: #c8e6c9;
}
.icon {
  font-size: 20px;
}
@media (max-width: 700px) {
  .admin-sidebar {
    position: static;
    width: 100%;
    height: auto;
    flex-direction: row;
    border-right: none;
    border-bottom: 1.5px solid #b2dfdb;
    box-shadow: none;
    padding-top: 0;
    justify-content: center;
    top: 0;
  }
  .admin-sidebar a {
    border-radius: 8px;
    margin-bottom: 0;
    margin-right: 8px;
    padding: 10px 14px;
    font-size: 16px;
  }
}
</style>
