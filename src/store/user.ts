import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const email = ref('')
  const isLoggedIn = ref(false)

  function setUser(emailValue: string) {
    email.value = emailValue
    isLoggedIn.value = true
  }

  function logout() {
    email.value = ''
    isLoggedIn.value = false
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
  }

  // 嘗試自動載入 localStorage email
  function tryLoad() {
    const token = localStorage.getItem('token')
    const userEmail = localStorage.getItem('userEmail')
    if (token && userEmail) {
      email.value = userEmail
      isLoggedIn.value = true
    }
  }

  return { email, isLoggedIn, setUser, logout, tryLoad }
})

