<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

onMounted(() => {
  userStore.tryLoad()
})

const maskedEmail = computed(() => {
  if (!userStore.email) return ''
  const email = userStore.email
  const atIdx = email.indexOf('@')
  if (atIdx < 0) return email
  const prefix = email.slice(0, 3)
  return `${prefix}**@gmail`
})

function handleLogout() {
  userStore.logout()
  localStorage.removeItem('userEmail')
  router.push('/')
}
</script>

<template>
  <nav>
    <div class="nav-left">
      <router-link to="/">Home</router-link> |
      <router-link to="/products">Products</router-link> |
      <router-link to="/cart">Cart</router-link>
    </div>
    <div class="nav-right">
      <template v-if="userStore.isLoggedIn">
        <span class="user-email">{{ maskedEmail }}</span>
        <button class="logout-btn" @click="handleLogout">登出</button>
      </template>
      <template v-else>
        <router-link to="/login">Login</router-link>
      </template>
    </div>
  </nav>
</template>

<style scoped>
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #333;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-left {
  display: flex;
  gap: 15px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-email {
  color: #ffaf63;
  font-weight: 700;
  margin-right: 8px;
}
.logout-btn {
  background: #fff;
  color: #333;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 15px;
  cursor: pointer;
  font-weight: bolder;
}
.logout-btn:hover {
  background: #eee;
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
