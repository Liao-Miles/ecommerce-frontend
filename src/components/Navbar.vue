<script setup lang="ts">

</script>

<template>
  <nav>
    <router-link to="/">Home</router-link> |
    <router-link to="/products">Products</router-link> |
    <router-link to="/cart">Cart</router-link> |
    <router-link to="/login">Login</router-link>
  </nav>
</template>

<style scoped>
nav {
  position: fixed;   /* 固定在上方 */
  top: 0;
  left: 0;
  width: 100%;
  background-color: #333; /* 深色背景 */
  padding: 10px 20px;
  display: flex;
  gap: 15px;
}

nav a {
  color: #fff;
  text-decoration: none;
  font-weight: 500;
}

nav a:hover {
  text-decoration: underline;
}
</style>
