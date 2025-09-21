<template>
  <div class="admin-dashboard">
    <h2>管理員主控台</h2>
    <ul>
      <li><router-link to="/admin/products">商品管理</router-link></li>
      <li><router-link to="/admin/orders">訂單管理</router-link></li>
      <li><router-link to="/admin/users">用戶管理</router-link></li>
    </ul>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.admin-dashboard {
  max-width: 500px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin: 18px 0;
  font-size: 18px;
}
</style>

