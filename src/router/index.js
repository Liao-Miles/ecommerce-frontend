import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Cart from '../views/Cart.vue'
import Checkout from '../views/Checkout.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/products', component: ProductList },
    { path: '/products/:id', component: ProductDetail, props: true },
    { path: '/cart', component: Cart },
    { path: '/checkout', name: 'Checkout', component: Checkout },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
